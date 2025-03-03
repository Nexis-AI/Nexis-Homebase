import { NextRequest, NextResponse } from 'next/server';
import Moralis from 'moralis';
import { initMoralis } from '@/lib/moralis-client';
import { EvmChain } from 'moralis/common-evm-utils';

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const chain = searchParams.get('chain') || '0x1'; // Default to Ethereum mainnet
    const limit = searchParams.get('limit') || '25';

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    // Initialize Moralis
    await initMoralis();

    // Get wallet transactions
    const transactions = await Moralis.EvmApi.transaction.getWalletTransactions({
      address,
      chain: chain as string,
      limit: parseInt(limit, 10),
    });

    // Get token transfers
    const tokenTransfers = await Moralis.EvmApi.token.getWalletTokenTransfers({
      address,
      chain: chain as string,
      limit: parseInt(limit, 10),
    });

    // Get approvals
    const approvals = await Moralis.EvmApi.token.getWalletTokenApprovals({
      address,
      chain: chain as string,
      limit: parseInt(limit, 10),
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.toJSON(),
        tokenTransfers: tokenTransfers.toJSON(),
        approvals: approvals.toJSON(),
      }
    });
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
} 