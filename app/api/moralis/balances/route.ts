import { type NextRequest, NextResponse } from 'next/server';
import Moralis from 'moralis';
import { initMoralis } from '@/lib/moralis-client';

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const chain = searchParams.get('chain') || '0x1'; // Default to Ethereum mainnet

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    // Initialize Moralis
    await initMoralis();

    // Get native balance
    const nativeBalance = await Moralis.EvmApi.balance.getNativeBalance({
      address,
      chain: chain as any,
    });

    // Get token balances
    const tokenBalances = await Moralis.EvmApi.token.getWalletTokenBalances({
      address,
      chain: chain as any,
    });

    return NextResponse.json({
      success: true,
      data: {
        nativeBalance: nativeBalance.toJSON(),
        tokenBalances: tokenBalances.toJSON(),
      }
    });
  } catch (error) {
    console.error('Error fetching wallet balances:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch balances' },
      { status: 500 }
    );
  }
} 