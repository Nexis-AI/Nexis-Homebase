import { NextResponse } from 'next/server';
import { RPC_URLS } from '@/lib/wallet-config';

// Helper function to check RPC endpoint
const checkRpcEndpoint = async (url: string, timeout = 3000) => {
  try {
    // Prepare a simple eth_blockNumber request
    const body = JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: Date.now()
    });

    // Abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return { success: false, error: `HTTP error: ${response.status}` };
    }
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message || 'Unknown JSON-RPC error' };
    }
    
    if (!data.result) {
      return { success: false, error: 'No result returned' };
    }
    
    return {
      success: true,
      blockNumber: data.result,
      blockNumberDecimal: Number.parseInt(data.result, 16)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export async function GET() {
  // Get all RPC endpoints from config
  const endpoints = RPC_URLS?.mainnet || [];
  
  const results = await Promise.all(
    endpoints.map(async (url: string) => {
      const result = await checkRpcEndpoint(url);
      return {
        url,
        hostname: url.includes('://') ? new URL(url).hostname : url,
        ...result
      };
    })
  );
  
  // Find first working endpoint
  const workingEndpoint = results.find((r: { success: boolean }) => r.success);
  
  return NextResponse.json({
    status: workingEndpoint ? 'ok' : 'error',
    endpoints: results,
    workingEndpoint: workingEndpoint || null,
    timestamp: new Date().toISOString()
  });
} 