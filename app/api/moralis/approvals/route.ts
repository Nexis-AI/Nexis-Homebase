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
    
    // Get token transfers to help discover approvals
    const transfers = await Moralis.EvmApi.token.getWalletTokenTransfers({
      address,
      chain: chain as string
    });
    
    // For each token, get allowance (since Moralis doesn't have a direct "get all approvals" endpoint)
    // This is a simplified approach - for production, you would analyze past approve transactions
    const transfersData = transfers.toJSON();
    const tokenAddresses = new Set<string>();
    
    // Extract unique token addresses from transfers
    if (transfersData.result && Array.isArray(transfersData.result)) {
      for (const transfer of transfersData.result) {
        if (transfer.address) {
          tokenAddresses.add(transfer.address);
        }
      }
    }
    
    // For each token, get token metadata
    const tokenAllowances = [];
    
    // Limit to 10 tokens for this example to prevent too many API calls
    const tokenAddressesArray = Array.from(tokenAddresses).slice(0, 10);
    
    for (const tokenAddress of tokenAddressesArray) {
      try {
        // Get token metadata
        const metadata = await Moralis.EvmApi.token.getTokenMetadata({
          addresses: [tokenAddress],
          chain: chain as string
        });
        
        // We could check for common DeFi protocols here and check allowances
        // Common protocols like Uniswap, Aave, etc.
        const commonSpenders = [
          '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
          '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uniswap V3 Router
          // Add more common protocol addresses
        ];
        
        // Check allowance for a few common spenders
        for (const spender of commonSpenders) {
          try {
            const allowance = await Moralis.EvmApi.token.getTokenAllowance({
              address: tokenAddress,
              ownerAddress: address,
              spenderAddress: spender,
              chain: chain as string
            });
            
            const allowanceData = allowance.toJSON();
            if (allowanceData.allowance && allowanceData.allowance !== '0') {
              const metadataResult = metadata.toJSON();
              const tokenInfo = metadataResult[0] || { address: tokenAddress };
              
              tokenAllowances.push({
                token: tokenInfo,
                spender: spender,
                allowance: allowanceData.allowance
              });
            }
          } catch (e) {
            // Skip failed allowance checks
            console.error(`Error checking allowance for ${tokenAddress}:`, e);
          }
        }
      } catch (e) {
        // Skip failed token metadata
        console.error(`Error fetching metadata for ${tokenAddress}:`, e);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        approvals: tokenAllowances,
        count: tokenAllowances.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching wallet approvals:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch wallet approvals'
    }, { status: 500 });
  }
} 