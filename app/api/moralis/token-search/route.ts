import { NextResponse } from 'next/server';
import Moralis from 'moralis';
import { initMoralis } from '@/lib/moralis-client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const chain = searchParams.get('chain') || '0x1'; // Default to Ethereum Mainnet
  const limit = Number(searchParams.get('limit') || '10');
  const cursor = searchParams.get('cursor') || '';
  
  if (!query) {
    return NextResponse.json({ 
      success: false, 
      error: 'Search query is required' 
    }, { status: 400 });
  }

  try {
    await initMoralis();
    
    // Check if query is an address
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(query);
    
    let tokenData: any = null;
    let tokenPrice = null;
    
    if (isAddress) {
      // If query is an address, get token metadata
      const metadata = await Moralis.EvmApi.token.getTokenMetadata({
        addresses: [query],
        chain: chain as string
      });
      
      // Try to get token price if it's an address
      try {
        const price = await Moralis.EvmApi.token.getTokenPrice({
          address: query,
          chain: chain as string
        });
        tokenPrice = price.toJSON();
      } catch (priceError) {
        console.error('Error fetching token price:', priceError);
        // Continue even if price fetch fails
      }
      
      tokenData = metadata.toJSON();
    } else {
      // If query is a text search, search for tokens
      const searchResult = await Moralis.EvmApi.token.searchToken({
        query,
        chain: chain as string,
        limit,
        cursor
      });
      
      tokenData = searchResult.toJSON();
    }
    
    // Get trending tokens for additional context
    let trendingTokens = null;
    try {
      // This is a placeholder - at the time of writing, 
      // Moralis might not have a direct 'trending tokens' endpoint
      // You would need to check their latest documentation
      // This could be a custom implementation that tracks volume changes
      
      // Placeholder for trending tokens logic
      trendingTokens = [];
    } catch (trendingError) {
      console.error('Error fetching trending tokens:', trendingError);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        tokens: tokenData,
        price: tokenPrice,
        trending: trendingTokens,
        query,
        isAddress
      }
    });
    
  } catch (error) {
    console.error('Error searching tokens:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to search tokens'
    }, { status: 500 });
  }
} 