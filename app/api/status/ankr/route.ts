import { NextResponse } from 'next/server';
import { ANKR_RPC_URLS } from '@/lib/ankr-config';

export async function GET() {
  try {
    const ankrEndpoint = ANKR_RPC_URLS['0x1']; // Ethereum mainnet
    
    if (!ankrEndpoint) {
      return NextResponse.json({
        status: 'error',
        message: 'ANKR endpoint not configured',
      }, { status: 500 });
    }
    
    // Make a simple JSON-RPC call to check if working
    const response = await fetch(ankrEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });
    
    if (!response.ok) {
      return NextResponse.json({
        status: 'error',
        message: `ANKR RPC HTTP error: ${response.status}`,
      }, { status: response.status });
    }
    
    const data = await response.json();
    
    if (data.error) {
      return NextResponse.json({
        status: 'error',
        message: data.error.message || 'Unknown ANKR RPC error',
      }, { status: 500 });
    }
    
    return NextResponse.json({
      status: 'ok',
      result: data.result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('ANKR status check failed:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error checking ANKR RPC',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 