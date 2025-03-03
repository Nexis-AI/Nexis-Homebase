import { NextResponse } from 'next/server';
import { initMoralis, withMoralis } from '@/lib/moralis-client';
import Moralis from 'moralis';

export async function GET() {
  try {
    // Initialize Moralis with the API key from .env
    await initMoralis();
    
    // Test if Moralis is initialized by fetching a simple data point
    const apiKeyStatus = await withMoralis(async () => {
      // Get ETH price as a simple test
      const ethPrice = await Moralis.EvmApi.token.getTokenPrice({
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH address
        chain: '0x1',
      });
      
      return {
        success: true,
        price: ethPrice.toJSON(),
        apiKeySource: process.env.NEXT_PUBLIC_MORALIS_API_KEY ? 'Using NEXT_PUBLIC_MORALIS_API_KEY' : 'No API key found',
      };
    });
    
    return NextResponse.json({
      success: true,
      message: 'Moralis API key is working correctly',
      data: apiKeyStatus,
    });
  } catch (error) {
    console.error('Error testing Moralis API key:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to initialize Moralis with API key',
      error: error instanceof Error ? error.message : String(error),
      apiKeySource: process.env.NEXT_PUBLIC_MORALIS_API_KEY ? 'Using NEXT_PUBLIC_MORALIS_API_KEY' : 'No API key found',
    }, { status: 500 });
  }
} 