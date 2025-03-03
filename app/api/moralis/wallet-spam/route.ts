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
    
    // Get all tokens in the wallet
    const tokensResponse = await Moralis.EvmApi.token.getWalletTokenBalances({
      address,
      chain: chain as string
    });
    
    const tokens = tokensResponse.toJSON();
    
    // Filter out potential spam tokens
    const potentialSpamTokens = tokens.filter(token => 
      token.possible_spam === true
    );
    
    // Get token transfers to analyze patterns
    const transfersResponse = await Moralis.EvmApi.token.getWalletTokenTransfers({
      address,
      chain: chain as string,
      limit: 100
    });
    
    const transfers = transfersResponse.toJSON();
    
    // Analyze transfers for spam patterns
    // This is a simple heuristic - you might want to enhance this with more sophisticated checks
    const spamPatterns = {
      // Tokens that were received but not sent (airdrop pattern)
      airdroppedTokens: new Set<string>(),
      // Tokens with very low value
      lowValueTokens: new Set<string>(),
      // Tokens from addresses that sent to many wallets
      massAirdropTokens: new Set<string>()
    };
    
    if (Array.isArray(transfers.result)) {
      // Track tokens that were received but not sent
      const receivedTokens = new Set<string>();
      const sentTokens = new Set<string>();
      
      for (const transfer of transfers.result) {
        const tokenAddress = transfer.address;
        
        if (transfer.to_address.toLowerCase() === address.toLowerCase()) {
          receivedTokens.add(tokenAddress);
        }
        
        if (transfer.from_address.toLowerCase() === address.toLowerCase()) {
          sentTokens.add(tokenAddress);
        }
      }
      
      // Tokens received but never sent might be spam airdrops
      for (const token of receivedTokens) {
        if (!sentTokens.has(token)) {
          spamPatterns.airdroppedTokens.add(token);
        }
      }
    }
    
    // Mark tokens with very low value as potential spam
    for (const token of tokens) {
      const balance = Number.parseFloat(token.balance) / (10 ** token.decimals);
      // Use token.usdPrice if it exists, otherwise check for alternative price fields
      const tokenPrice = token.usdPrice || (token as any).usd_price || 0;
      const usdValue = tokenPrice ? balance * Number.parseFloat(String(tokenPrice)) : 0;
      
      if (usdValue > 0 && usdValue < 0.1) {
        spamPatterns.lowValueTokens.add(token.token_address);
      }
    }
    
    // Count how many tokens are flagged in multiple spam patterns
    const multiPatternTokens = new Set<string>();
    
    for (const token of potentialSpamTokens) {
      let patternCount = 0;
      const tokenAddress = token.token_address;
      
      if (spamPatterns.airdroppedTokens.has(tokenAddress)) patternCount++;
      if (spamPatterns.lowValueTokens.has(tokenAddress)) patternCount++;
      if (spamPatterns.massAirdropTokens.has(tokenAddress)) patternCount++;
      
      if (patternCount >= 2) {
        multiPatternTokens.add(tokenAddress);
      }
    }
    
    // Final spam classification
    const spamTokens = potentialSpamTokens.map(token => ({
      ...token,
      spam_confidence: multiPatternTokens.has(token.token_address) ? 'high' : 'medium'
    }));
    
    const safeTokens = tokens.filter(token => token.possible_spam !== true);
    
    return NextResponse.json({
      success: true,
      data: {
        spam_tokens: spamTokens,
        safe_tokens: safeTokens,
        spam_patterns: {
          airdropped_tokens: Array.from(spamPatterns.airdroppedTokens),
          low_value_tokens: Array.from(spamPatterns.lowValueTokens),
          mass_airdrop_tokens: Array.from(spamPatterns.massAirdropTokens)
        }
      }
    });
    
  } catch (error) {
    console.error('Error detecting spam tokens:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to detect spam tokens'
    }, { status: 500 });
  }
} 