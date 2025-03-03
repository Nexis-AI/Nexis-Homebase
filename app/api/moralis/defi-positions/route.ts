import { NextResponse } from 'next/server';
import Moralis from 'moralis';
import { initMoralis } from '@/lib/moralis-client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const chain = searchParams.get('chain') || '0x1'; // Default to Ethereum Mainnet
  
  if (!address) {
    return NextResponse.json({ 
      success: false, 
      error: 'Wallet address is required' 
    }, { status: 400 });
  }

  try {
    await initMoralis();
    
    // Fetch wallet token balances as a proxy for DeFi positions
    const tokenBalances = await Moralis.EvmApi.token.getWalletTokenBalances({
      address,
      chain: chain as string
    });
    
    // Get transaction history to discover DeFi interactions
    const transactions = await Moralis.EvmApi.transaction.getWalletTransactions({
      address,
      chain: chain as string,
      limit: 100
    });
    
    // Calculate statistics for token balances
    const balancesData = tokenBalances.toJSON();
    const transactionsData = transactions.toJSON();
    
    // Find total value and categorize tokens
    let totalValue = 0;
    const tokenSummary: Record<string, { count: number, totalValue: number }> = {};
    
    // Process token balances
    const tokens = balancesData;
    if (Array.isArray(tokens)) {
      for (const token of tokens) {
        if (token.usdPrice) {
          const value = Number(token.usdPrice) || 0;
          totalValue += value;
          
          // Group by token symbol
          const symbol = token.symbol || 'unknown';
          if (!tokenSummary[symbol]) {
            tokenSummary[symbol] = {
              count: 0,
              totalValue: 0
            };
          }
          
          tokenSummary[symbol].count += 1;
          tokenSummary[symbol].totalValue += value;
        }
      }
    }
    
    // Get native balance
    const nativeBalance = await Moralis.EvmApi.balance.getNativeBalance({
      address,
      chain: chain as string
    });
    
    return NextResponse.json({
      success: true,
      data: {
        tokenBalances: balancesData,
        nativeBalance: nativeBalance.toJSON(),
        transactions: transactionsData,
        stats: {
          totalValue,
          tokenSummary
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching DeFi data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch DeFi data'
    }, { status: 500 });
  }
} 