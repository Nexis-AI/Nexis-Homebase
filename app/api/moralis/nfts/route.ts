import { NextRequest, NextResponse } from 'next/server';
import Moralis from 'moralis';
import { initMoralis } from '@/lib/moralis-client';

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const chain = searchParams.get('chain') || '0x1'; // Default to Ethereum mainnet
    const limit = searchParams.get('limit') ? Number.parseInt(searchParams.get('limit') as string, 10) : 50;
    const tokenAddress = searchParams.get('tokenAddress'); // Optional for specific collection

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Initialize Moralis
    await initMoralis();

    // Fetch NFTs owned by the wallet
    const nftsResponse = await Moralis.EvmApi.nft.getWalletNFTs({
      address,
      chain: chain as string,
      limit,
      tokenAddresses: tokenAddress ? [tokenAddress] : undefined,
      mediaItems: true, // Include media URLs
      normalizeMetadata: true // Get standardized metadata
    });

    // Get NFT collections if no specific token address is provided
    let collections = null;
    if (!tokenAddress) {
      try {
        collections = await Moralis.EvmApi.nft.getWalletNFTCollections({
          address,
          chain: chain as string,
          limit: 10
        });
      } catch (collectionError) {
        console.error('Error fetching NFT collections:', collectionError);
        // Continue even if collections fetch fails
      }
    }

    // Get top NFT stats from trending collections (up to 5)
    let nftStats = null;
    try {
      // This is a placeholder - Moralis doesn't have a direct "top NFTs by volume" endpoint
      // You would need to implement a custom solution, potentially using getNFTTrades
      // for popular collections to calculate volumes
      
      // Example of getting trades for a popular collection if you know its address
      if (tokenAddress) {
        const trades = await Moralis.EvmApi.nft.getNFTTrades({
          address: tokenAddress,
          chain: chain as string,
          limit: 10
        });
        nftStats = { trades };
      }
    } catch (statsError) {
      console.error('Error fetching NFT stats:', statsError);
      // Continue even if stats fetch fails
    }

    return NextResponse.json({
      success: true,
      data: {
        nfts: nftsResponse,
        collections,
        stats: nftStats
      }
    });
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
} 