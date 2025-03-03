import axios from 'axios';

// Types for ANKR API responses
interface AnkrTokenAsset {
  blockchain: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  contractAddress: string;
  holderAddress: string;
  balance: string;
  balanceRawInteger: string;
  balanceUsd: string;
  thumbnail: string;
  isNativeToken: boolean;
}

interface AnkrBalanceResponse {
  assets: AnkrTokenAsset[];
  totalBalanceUsd: string;
  nextPageToken?: string;
}

// Chain IDs mapping for ANKR API
export const ANKR_CHAIN_MAP: Record<string, string> = {
  '0x1': 'eth', // Ethereum
  '0x89': 'polygon', // Polygon
  '0x38': 'bsc', // Binance Smart Chain
  '0xa': 'optimism', // Optimism
  '0xa4b1': 'arbitrum', // Arbitrum
  '0xfa': 'fantom', // Fantom
  '0xa86a': 'avalanche', // Avalanche
};

// Type for token balance
interface TokenBalance {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  balance_formatted: string;
  chain: string;
  chainName: string;
  usdPrice: number;
  usdValue: number;
}

// Type for portfolio history data
export interface PortfolioHistoryItem {
  date: string;
  value: number;
}

export interface PortfolioHistoryData {
  history: PortfolioHistoryItem[];
  currentValue: number;
  tokens: {
    native: {
      symbol: string;
      balance: string;
      value: number;
    };
    tokens: Array<{
      symbol: string;
      balance: string;
      value: number;
    }>;
  };
}

const ANKR_API_ENDPOINT = 'https://rpc.ankr.com/multichain';
const ANKR_API_KEY = process.env.NEXT_PUBLIC_ANKR_API_KEY || '';

// Create Ankr API client
export const ankrClient = axios.create({
  baseURL: ANKR_API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANKR_API_KEY}`,
  },
});

// Get wallet token balances across multiple chains
export async function getMultiChainTokenBalances(address: string, chains?: string[]) {
  try {
    // Convert hex chainIds to ANKR chain names
    const chainNames = chains 
      ? chains.map(chain => ANKR_CHAIN_MAP[chain]).filter(Boolean) 
      : Object.values(ANKR_CHAIN_MAP);

    const response = await ankrClient.post('/', {
      jsonrpc: '2.0',
      method: 'ankr_getAccountBalance',
      params: {
        blockchain: chainNames,
        walletAddress: address,
        onlyWhitelisted: false, // Include all tokens
      },
      id: new Date().getTime(),
    });

    if (response.data.error) {
      throw new Error(`ANKR API error: ${response.data.error.message}`);
    }

    return processAnkrBalancesResponse(response.data.result as AnkrBalanceResponse, chains);
  } catch (error) {
    console.error('Error fetching balances from ANKR:', error);
    // Return a standardized empty result that matches our existing format
    return {
      nativeBalance: { formatted: "0", balance: "0" },
      tokenBalances: { result: [] }
    };
  }
}

// Process the ANKR balance response to match our existing format
function processAnkrBalancesResponse(result: AnkrBalanceResponse, chains?: string[]) {
  // Map ANKR chains back to hex chainIds
  const reverseChainMap: Record<string, string> = {};
  
  // Replace forEach with for...of loop
  for (const [hex, name] of Object.entries(ANKR_CHAIN_MAP)) {
    reverseChainMap[name] = hex;
  }

  // Extract native balance
  const nativeTokens = result.assets.filter(asset => asset.isNativeToken);
  const totalNativeBalanceInWei = nativeTokens.reduce((sum: string, token) => {
    // Convert balance to common denominator (wei)
    const balanceInWei = BigInt(token.balanceRawInteger || '0');
    return (BigInt(sum) + balanceInWei).toString();
  }, "0");

  // Format token balances to match Moralis format
  const tokenBalances: TokenBalance[] = result.assets
    .filter(asset => !asset.isNativeToken)
    .map(token => {
      // Get chain ID from blockchain name
      const chainId = reverseChainMap[token.blockchain] || '0x1';
      
      // Only include tokens from requested chains
      if (chains && !chains.includes(chainId)) {
        return null;
      }

      return {
        token_address: token.contractAddress,
        name: token.tokenName,
        symbol: token.tokenSymbol,
        logo: token.thumbnail,
        thumbnail: token.thumbnail,
        decimals: token.tokenDecimals,
        balance: token.balanceRawInteger || '0',
        balance_formatted: token.balance || '0',
        chain: chainId,
        chainName: token.blockchain,
        usdPrice: token.balanceUsd ? Number.parseFloat(token.balanceUsd) / Number.parseFloat(token.balance || '1') : 0,
        usdValue: Number.parseFloat(token.balanceUsd || '0')
      };
    })
    .filter(Boolean) as TokenBalance[];

  return {
    nativeBalance: {
      balance: totalNativeBalanceInWei,
      formatted: nativeTokens.reduce((sum: number, token) => sum + Number.parseFloat(token.balance || '0'), 0).toString()
    },
    tokenBalances: {
      result: tokenBalances
    }
  };
}

// Get portfolio history using current balances and simulated historical prices
export async function getWalletPortfolioHistory(
  address: string, 
  chainId = '0x1', 
  days = 30
): Promise<PortfolioHistoryData> {
  try {
    // Get current balances
    const balances = await getMultiChainTokenBalances(address, chainId ? [chainId] : undefined);
    
    // Calculate current value
    const nativeTokenValue = balances.nativeBalance.formatted 
      ? Number.parseFloat(balances.nativeBalance.formatted) : 0;
    
    const tokensValue = balances.tokenBalances.result.reduce(
      (sum, token) => sum + (token.usdValue || 0), 0
    );
    
    const currentValue = nativeTokenValue + tokensValue;
    
    // Generate historical data with realistic fluctuations
    const history = generateHistoricalData(currentValue, days);
    
    // Format tokens for portfolio display
    const tokens = {
      native: {
        symbol: chainId ? getChainNativeSymbol(chainId) : 'ETH',
        balance: balances.nativeBalance.formatted,
        value: nativeTokenValue
      },
      tokens: balances.tokenBalances.result.map(token => ({
        symbol: token.symbol || 'Unknown',
        balance: token.balance_formatted || '0',
        value: token.usdValue || 0
      }))
    };
    
    return { history, currentValue, tokens };
  } catch (error) {
    console.warn('Error generating portfolio history with ANKR:', error);
    // Generate mock data as fallback
    const mockCurrentValue = 10000; // Default value for mock data
    const history = generateHistoricalData(mockCurrentValue, days);
    return { 
      history, 
      currentValue: mockCurrentValue,
      tokens: {
        native: { symbol: 'ETH', balance: '0', value: 0 },
        tokens: []
      }
    };
  }
}

// Get chain native token symbol
function getChainNativeSymbol(chainId: string): string {
  const chainSymbols: Record<string, string> = {
    '0x1': 'ETH',
    '0x89': 'MATIC',
    '0x38': 'BNB',
    '0xa': 'ETH',
    '0xa4b1': 'ETH',
    '0xfa': 'FTM',
    '0xa86a': 'AVAX'
  };
  
  return chainSymbols[chainId] || 'ETH';
}

// Generate historical data with realistic fluctuations
function generateHistoricalData(currentValue: number, days: number): PortfolioHistoryItem[] {
  const history: PortfolioHistoryItem[] = [];
  const now = new Date();
  
  // Use a more realistic starting point (a percentage of current value)
  // This creates a more natural growth curve
  let initialValuePercentage: number;
  
  // Different growth patterns based on timeframe
  if (days <= 7) {
    // For shorter timeframes, less variation (3-8%)
    initialValuePercentage = 0.95 + (Math.random() * 0.1); // 95-105% of current
  } else if (days <= 30) {
    // For medium timeframes, moderate variation (10-20%)
    initialValuePercentage = 0.85 + (Math.random() * 0.15); // 85-100% of current
  } else {
    // For long timeframes, more variation (20-40%)
    initialValuePercentage = 0.7 + (Math.random() * 0.25); // 70-95% of current
  }
  
  // Ensure we don't start higher than current in typical cases
  if (Math.random() > 0.8) {
    // 20% chance of starting higher than current (for bear market scenarios)
    initialValuePercentage = 1.05 + (Math.random() * 0.15); // 105-120% of current
  }
  
  // Calculate the starting value
  const startingValue = currentValue * initialValuePercentage;
  
  // Generate more realistic day-to-day changes
  // We'll use a blend of trend and random walk with momentum
  let prevValue = startingValue;
  let momentum = 0; // Keeps track of trend direction
  
  // Daily volatility based on timeframe
  const baseVolatility = days <= 7 ? 0.02 : days <= 30 ? 0.03 : 0.04;
  
  // Create day-by-day values
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // For the last day (today), use current value
    if (i === 0) {
      history.push({
        date: dateStr,
        value: currentValue
      });
      continue;
    }
    
    // Calculate this day's change
    // Blend of random + momentum + trend factors
    
    // Random component (daily market noise)
    const randomFactor = (Math.random() * 2 - 1) * baseVolatility;
    
    // Momentum component (markets tend to continue in same direction short-term)
    const momentumFactor = momentum * 0.3; // 30% influence from previous movement
    
    // Long-term trend component (tends toward current value)
    const distanceFromCurrent = (currentValue - prevValue) / prevValue;
    const trendFactor = distanceFromCurrent * 0.05; // 5% pull toward current value
    
    // Combine factors with diminishing importance as we get closer to present
    const dayFactor = i / days; // 0 for today, 1 for oldest day
    const combinedChange = 
      (randomFactor * (0.7 + dayFactor * 0.3)) +  // Random is stronger in past
      (momentumFactor * (0.6 - dayFactor * 0.4)) + // Momentum stronger in recent days
      (trendFactor * (0.6 - dayFactor * 0.3));     // Trend stronger in recent days
    
    // Apply change to previous value
    const newValue = prevValue * (1 + combinedChange);
    
    // Update momentum for next iteration
    momentum = (newValue - prevValue) / prevValue;
    
    // Store value and update previous
    history.push({
      date: dateStr,
      value: Math.max(newValue, 0) // Ensure no negative values
    });
    
    prevValue = newValue;
  }
  
  // Return in chronological order (oldest to newest)
  return history.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

// For component exports
export const getTokenBalances = getMultiChainTokenBalances;
export const getPortfolioHistory = getWalletPortfolioHistory; 