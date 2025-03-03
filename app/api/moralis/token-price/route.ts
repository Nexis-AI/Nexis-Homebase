import { NextResponse } from "next/server";
import Moralis from "moralis";
import { initMoralis } from "@/lib/moralis";
import { isAddress } from 'ethers';

// Interfaces for Moralis API responses
interface TokenPriceResponse {
  tokenAddress?: string;
  usdPrice?: number;
  nativePrice?: {
    value: string;
    decimals: number;
    name: string;
    symbol: string;
    address: string;
  };
  exchangeAddress?: string;
  exchangeName?: string;
  priceChange?: {
    '24h'?: number;
    '7d'?: number;
    '30d'?: number;
  };
}

// Map token symbols to their addresses for common tokens
const tokenAddressMap: Record<string, string> = {
  eth: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  wbtc: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  dai: '0x6b175474e89094c44da98b954eedeac495271d0f',
  link: '0x514910771af9ca656af840dff83e8264ecf986ca',
  uni: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  nzt: '0x1234567890abcdef1234567890abcdef12345678', // Replace with actual NZT token address
};

// Cache structure with types
interface CacheEntry {
  price: TokenPriceResponse;
  timestamp: number;
}

const cache: Record<string, CacheEntry> = {};
const CACHE_DURATION = 60 * 1000; // 1 minute
const REQUEST_TIMEOUT = 10 * 1000; // 10 seconds

/**
 * GET token price information from Moralis API
 */
export async function GET(request: Request) {
  try {
    await initMoralis();

    const { searchParams } = new URL(request.url);
    let address = searchParams.get('address')?.toLowerCase();
    const chain = searchParams.get('chain') || '0x1';

    // Validate input
    if (!address) {
      return NextResponse.json({ error: 'Missing token address or symbol' }, { status: 400 });
    }

    // If not a valid address, try to resolve from our symbol map
    if (!isAddress(address)) {
      const mappedAddress = tokenAddressMap[address];
      if (!mappedAddress) {
        return NextResponse.json({ 
          error: `Invalid token address and unknown symbol: ${address}`, 
          supportedSymbols: Object.keys(tokenAddressMap).join(', ')
        }, { status: 400 });
      }
      address = mappedAddress;
    }

    // Check cache first
    const cacheKey = `${address}-${chain}`;
    const cachedEntry = cache[cacheKey];

    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_DURATION) {
      console.log(`[Token Price] Cache hit for ${address}`);
      return NextResponse.json({ 
        success: true, 
        price: cachedEntry.price, 
        cached: true,
        cachedAt: new Date(cachedEntry.timestamp).toISOString()
      });
    }

    console.log(`[Token Price] Fetching from Moralis: ${address}`);
    
    // Create a timeout promise to abort long-running requests
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), REQUEST_TIMEOUT);
    });

    // Race between the actual request and the timeout
    const priceResponse = await Promise.race([
      Moralis.EvmApi.token.getTokenPrice({ address, chain }),
      timeoutPromise
    ]);

    const price = priceResponse.toJSON();

    // Store in cache
    cache[cacheKey] = { 
      price, 
      timestamp: Date.now() 
    };

    return NextResponse.json({ 
      success: true, 
      price, 
      cached: false 
    });
  } catch (error) {
    console.error('Error fetching token price:', error);
    
    // Determine the status code and message based on error type
    let statusCode = 500;
    let errorMessage = 'Failed to fetch token price';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific Moralis errors
      if ('code' in error && typeof error.code === 'string') {
        if (error.code === 'A0003') {
          errorMessage = 'Moralis API key is not set correctly';
        } else if (error.code === 'C0005') {
          errorMessage = 'Invalid Ethereum address provided';
          statusCode = 400;
        }
      }
      
      // Handle timeout error
      if (errorMessage === 'Request timed out') {
        statusCode = 504; // Gateway Timeout
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      success: false,
    }, { status: statusCode });
  }
} 