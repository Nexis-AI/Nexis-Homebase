import { NextResponse } from 'next/server';
import Moralis from 'moralis';

// Initialize Moralis if needed
const initMoralis = async () => {
  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
    }
    return true;
  } catch (error) {
    console.error('Failed to initialize Moralis:', error);
    return false;
  }
};

export async function GET() {
  try {
    // Initialize Moralis
    const initialized = await initMoralis();
    
    if (!initialized) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to initialize Moralis API',
      }, { status: 500 });
    }
    
    // Try to make a simple API call to check if Moralis is working
    // Using getBlock endpoint with 'latest' as a simple test
    const block = await Moralis.EvmApi.block.getBlock({
      blockNumberOrHash: 'latest',
      chain: '0x1', // Ethereum mainnet
    });
    
    if (!block) {
      return NextResponse.json({
        status: 'error',
        message: 'Moralis API returned null block',
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }
    
    const blockData = block.toJSON();
    
    return NextResponse.json({
      status: 'ok',
      syncedToBlock: blockData.number,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Moralis status check failed:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error checking Moralis status',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 