import { NextResponse } from 'next/server';
import { getWalletTokenBalancesPrice, getWalletNFTs } from '../moralis';
import Moralis from 'moralis';
import { initMoralis } from '@/lib/moralis-client';

export async function POST(request: Request) {
  try {
    const { walletAddress, chainId } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Initialize Moralis
    await initMoralis();

    // Fetch wallet details
    const [tokenBalances, nfts] = await Promise.all([
      getWalletTokenBalancesPrice(walletAddress, chainId || '0x1'),
      getWalletNFTs(walletAddress, chainId || '0x1')
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tokenBalances,
        nfts
      }
    });
  } catch (error) {
    console.error('Wallet details fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet details' }, { status: 500 });
  }
} 