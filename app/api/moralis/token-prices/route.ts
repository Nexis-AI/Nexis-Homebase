import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Moralis from 'moralis';
import { initMoralis } from '@/lib/moralis-client';
import { isAddress } from 'ethers';

// Interface for token price response
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
 * GET token prices for multiple tokens from Moralis API in one call
 */
export async function GET(request: NextRequest) {
  try {
    await initMoralis();

    const { searchParams } = new URL(request.url);
    const tokensParam = searchParams.get('tokens');
    const chain = searchParams.get('chain') || '0x1';
    
    // Validate input
    if (!tokensParam) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing tokens parameter. Please provide comma-separated token addresses or symbols.'
      }, { status: 400 });
    }
    
    // Parse and normalize tokens
    const inputTokens = tokensParam.split(',').map(t => t.trim().toLowerCase());
    const validTokens: string[] = [];
    const invalidTokens: string[] = [];
    
    // Validate each token and resolve symbols to addresses
    for (const token of inputTokens) {
      // Skip empty tokens
      if (!token) continue;
      
      // Check if it's a valid address or a known symbol
      if (isAddress(token)) {
        validTokens.push(token);
      } else if (tokenAddressMap[token]) {
        validTokens.push(tokenAddressMap[token]);
      } else {
        invalidTokens.push(token);
      }
    }
    
    if (validTokens.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid token addresses provided',
        invalidTokens,
        supportedSymbols: Object.keys(tokenAddressMap).join(', ')
      }, { status: 400 });
    }
    
    // Check cache and identify which tokens need to be fetched
    const now = Date.now();
    const cachedPrices: Record<string, TokenPriceResponse | null> = {};
    const tokensToFetch: string[] = [];
    
    for (const address of validTokens) {
      const cacheKey = `${address}-${chain}`;
      const cachedEntry = cache[cacheKey];
      
      if (cachedEntry && now - cachedEntry.timestamp < CACHE_DURATION) {
        cachedPrices[address] = cachedEntry.price;
      } else {
        tokensToFetch.push(address);
      }
    }
    
    // Fetch prices for tokens not in cache
    const newlyFetchedPrices: Record<string, TokenPriceResponse | null> = {};
    
    if (tokensToFetch.length > 0) {
      console.log(`[Token Prices] Fetching ${tokensToFetch.length} tokens from Moralis`);
      
      // Fetch prices in batches if needed (adjust batch size as needed)
      const BATCH_SIZE = 20;
      const batches = [];
      
      for (let i = 0; i < tokensToFetch.length; i += BATCH_SIZE) {
        batches.push(tokensToFetch.slice(i, i + BATCH_SIZE));
      }
      
      const batchPromises = batches.map(async (batchTokens) => {
        try {
          const pricePromises = batchTokens.map(address => 
            Promise.race([
              Moralis.EvmApi.token.getTokenPrice({ address, chain }),
              new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out')), REQUEST_TIMEOUT);
              })
            ]).catch(error => {
              console.error(`Error fetching price for ${address}:`, error);
              return null; // Return null for failed requests
            })
          );
          
          const results = await Promise.all(pricePromises);
          
          // Process results
          for (let i = 0; i < batchTokens.length; i++) {
            const address = batchTokens[i];
            const result = results[i];
            
            if (result) {
              const price = result.toJSON();
              newlyFetchedPrices[address] = price;
              
              // Update cache
              const cacheKey = `${address}-${chain}`;
              cache[cacheKey] = { 
                price, 
                timestamp: now 
              };
            } else {
              // Store null for addresses that failed to fetch
              newlyFetchedPrices[address] = null;
            }
          }
        } catch (error) {
          console.error('Error in batch fetch:', error);
        }
      });
      
      await Promise.all(batchPromises);
    }
    
    // Combine cached and newly fetched prices
    const allPrices = { ...cachedPrices, ...newlyFetchedPrices };
    
    return NextResponse.json({ 
      success: true, 
      prices: allPrices,
      meta: {
        totalRequested: inputTokens.length,
        validTokens: validTokens.length,
        invalidTokens,
        cachedResults: Object.keys(cachedPrices).length,
        newlyFetched: Object.keys(newlyFetchedPrices).length
      }
    });
  } catch (error) {
    console.error('Error fetching token prices:', error);
    
    // Determine the status code and message based on error type
    const statusCode = 500;
    let errorMessage = 'Failed to fetch token prices';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific Moralis errors
      if ('code' in error && typeof error.code === 'string') {
        if (error.code === 'A0003') {
          errorMessage = 'Moralis API key is not set correctly';
        }
      }
    }
    
    return NextResponse.json({ 
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
} 