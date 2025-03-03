"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAccount, useBalance, usePublicClient, useNetwork, useDisconnect, useEnsName } from 'wagmi';
import { formatUnits, formatEther } from 'viem';
import { useChainId } from 'wagmi';
import { mainnet } from 'viem/chains';
import { useTokenPrices } from './use-token-prices';
import { useLocalStorage } from './use-local-storage';
import type { Hash } from 'viem';
import { publicClient } from '../wallet-config';
import { useEthersProvider, useEthersSigner } from './use-ethers';
import { Provider } from 'ethers';
import { useTransactionWatcher } from './use-transaction-watcher';

// Interfaces for token balances
export interface TokenInfo {
  name: string;
  symbol: string;
  address?: string;
  decimals: number;
  logo?: string;
}

export interface TokenBalance {
  token: TokenInfo;
  balance: number | bigint;
  formattedBalance: string;
  price: number;
  value: number;
  change24h: number;
  marketCap?: string;
  volume24h?: string;
}

// Interfaces for transaction history
export interface Transaction {
  id: string;
  hash: string;
  type: 'send' | 'receive' | 'swap' | 'approve' | 'other';
  token: string;
  amount: string;
  from?: string;
  to?: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
}

// Interfaces for approval status
export interface Approval {
  id: string;
  protocol: string;
  token: string;
  allowance: string;
  lastUsed?: string;
  risk: 'high' | 'medium' | 'low';
}

// Interface for portfolio statistics
export interface PortfolioStats {
  totalValue: number;
  fiatValue: number;
  nftValue: number;
  stakedValue: number;
  change24h: number;
  change24hUSD: number;
}

// Interface for the dashboard expected balance format
export interface DashboardTokenBalance {
  name: string;
  symbol: string;
  balance: number;
  price: number;
  changePercentage: number;
  address?: string;
}

// Interface for the activity format expected by the dashboard
export interface DashboardActivity {
  id: string;
  type: string;
  status: string;
  amount: number;
  symbol: string;
  timestamp: number;
  address?: string;
}

// Interface for the hook return value
export interface WalletData {
  isLoading: boolean;
  address?: string;
  ensName?: string;
  tokens: TokenBalance[];
  balances: DashboardTokenBalance[]; // Add this to match what dashboard expects
  activities: DashboardActivity[]; // More specific type instead of any[]
  portfolio: PortfolioStats;
  transactions: Transaction[];
  approvals: Approval[];
  refetchWalletData?: () => Promise<void>;
  refetch: () => Promise<void>; // Alias for refetchWalletData for backward compatibility
  addCustomToken: (token: TokenInfo) => void;
  removeCustomToken: (tokenAddressOrSymbol: string) => void;
  customTokens: TokenInfo[];
  connectionState: string;
  connectionError?: Error | null;
  error?: Error | null;
  formattedEthBalance: string | null;
  ethBalance: string | null;
  isLoadingBalance: boolean;
}

// Connection state constants for better UX
const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting', 
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

// Maximum number of retries for RPC calls
const MAX_RETRIES = 3;

// Helper function to format market cap
function formatMarketCap(marketCap?: number): string {
  if (!marketCap) return 'N/A';
  if (marketCap >= 1_000_000_000_000) {
    return `${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (marketCap >= 1_000_000_000) {
    return `${(marketCap / 1_000_000_000).toFixed(2)}B`;
  }
  if (marketCap >= 1_000_000) {
    return `${(marketCap / 1_000_000).toFixed(2)}M`;
  }
  return `${(marketCap / 1_000).toFixed(2)}K`;
}

// Helper function to format volume
function formatVolume(volume?: number): string {
  if (!volume) return 'N/A';
  if (volume >= 1_000_000_000_000) {
    return `${(volume / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  }
  return `${(volume / 1_000).toFixed(2)}K`;
}

// Sample token list with metadata for Ethereum mainnet
const TOKENS = {
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6,
    logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: 6,
    logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  },
  WBTC: {
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    decimals: 8,
    logo: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png',
  },
  // Add a mock NZT token for Nexis
  NZT: {
    name: 'Nexis Token',
    symbol: 'NZT',
    address: '0x123456789abcdef123456789abcdef123456789a',
    decimals: 18,
    logo: 'https://placehold.co/200x200/4F46E5/FFFFFF?text=NZT',
  },
};

// Utility function to safely check if token has address property
// Add this before the useWalletData hook
function hasAddress(token: TokenInfo): token is TokenInfo & { address: string } {
  return 'address' in token && typeof token.address === 'string';
}

// Define a retry function for RPC calls
const retryRpcCall = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if this is an RPC error that we should retry
      const isRpcError = 
        error instanceof Error && 
        (error.message.includes('HTTP request failed') || 
         error.message.includes('Failed to fetch') ||
         error.message.includes('RPC error'));
      
      if (!isRpcError || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const backoffTime = delayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  
  // This should never be reached due to the throw above, but TypeScript needs it
  throw lastError;
};

/**
 * Hook to fetch and manage wallet data including balances, transactions, and approvals
 * Optimized for production with retry limits and automatic updates on transactions
 */
export function useWalletData(): WalletData {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // Enhanced state management for better UX
  const [connectionState, setConnectionState] = useState(
    isConnected ? CONNECTION_STATES.CONNECTED : CONNECTION_STATES.DISCONNECTED
  );
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  
  // Balance data with optimized fetching
  const [walletEthBalance, setWalletEthBalance] = useState<string | null>(null);
  const [formattedEthBalance, setFormattedEthBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // For tracking retry attempts
  const retryCount = useRef(0);
  const lastSuccessfulFetch = useRef<number | null>(null);
  const isFirstLoad = useRef(true);
  
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioStats>({
    totalValue: 0,
    fiatValue: 0,
    nftValue: 0,
    stakedValue: 0,
    change24h: 0,
    change24hUSD: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [ensName, setEnsName] = useState<string | undefined>(undefined);
  
  // Get ETH balance with optimized configuration
  const { data: ethBalanceData, refetch: refetchEthBalance } = useBalance({
    address,
    query: {
      enabled: Boolean(address) && isConnected,
      staleTime: 30_000, // Consider stale after 30 seconds
      gcTime: 60_000, // Cache for 1 minute
      retry: false, // Don't watch for changes, we'll manage updates manually
    }
  });
  
  // Generate a wallet-specific storage key to keep custom tokens separate per wallet
  const walletKey = address ? `nexis-custom-tokens-${address.toLowerCase()}` : 'nexis-custom-tokens';
  
  // Get custom tokens from localStorage using the wallet-specific key
  const [storedCustomTokens, setStoredCustomTokens] = useLocalStorage<Record<string, TokenInfo>>(
    walletKey, 
    {}
  );

  // Combine default tokens with custom tokens
  const allTokens = useMemo(() => ({ ...TOKENS, ...storedCustomTokens }), [storedCustomTokens]);
  
  // Extract token symbols for price fetching
  const tokenSymbols = Object.values(allTokens).map(token => token.symbol.toLowerCase());
  
  // Fetch real-time prices (rename variables to avoid conflicts)
  const { prices: fetchedPrices, refreshPrices: refreshTokenPrices, error: tokenPriceError } = useTokenPrices(tokenSymbols);
  
  // Optimize the initial connection
  useEffect(() => {
    if (isConnected && !walletEthBalance) {
      // Set connecting state for better UX
      setConnectionState(
        isFirstLoad.current ? CONNECTION_STATES.CONNECTING : CONNECTION_STATES.RECONNECTING
      );
      
      // Fetch initial data
      fetchWalletData();
      isFirstLoad.current = false;
    } else if (!isConnected) {
      // Reset state when disconnected
      setConnectionState(CONNECTION_STATES.DISCONNECTED);
      setWalletEthBalance(null);
      setFormattedEthBalance(null);
      retryCount.current = 0;
    }
  }, [isConnected, walletEthBalance]);
  
  // Function to fetch wallet data with optimized error handling
  const fetchWalletData = useCallback(async () => {
    if (!address || !isConnected) return;
    
    setIsLoadingBalance(true);
    
    try {
      // Fetch ETH balance with retry mechanism
      const balance = await fetchEthBalance(address);
      
      if (balance !== null) {
        // Format the balance for display
        const formatted = formatBalanceWithPrecision(balance);
        
        // Update state
        setWalletEthBalance(balance);
        setFormattedEthBalance(formatted);
        
        // Mark success
        setConnectionState(CONNECTION_STATES.CONNECTED);
        setConnectionError(null);
        retryCount.current = 0; // Reset retry count on success
        lastSuccessfulFetch.current = Date.now();
      }
      
      // Fetch real token balances from Moralis API route instead of direct client call
      const chainIdHex = `0x${chainId.toString(16)}`;
      
      // Use the new API route for fetching balances
      const balancesResponse = await fetch(`/api/moralis/balances?address=${address}&chain=${chainIdHex}`);
      
      if (!balancesResponse.ok) {
        throw new Error(`Failed to fetch balances: ${balancesResponse.statusText}`);
      }
      
      const balancesData = await balancesResponse.json();
      
      if (!balancesData.success) {
        throw new Error(balancesData.error || 'Failed to fetch balances');
      }
      
      const tokenData = balancesData.data;
      
      // Transform the token balances data into our format
      const ethPrice = fetchedPrices?.eth?.usdPrice || 3500;
      const tokenBalances: TokenBalance[] = [];
      
      // Add native token (ETH)
      if (tokenData.nativeBalance) {
        const ethBalance = tokenData.nativeBalance.balance 
          ? Number(formatEther(BigInt(tokenData.nativeBalance.balance))) 
          : Number(balance || 0);
          
        tokenBalances.push({
          token: TOKENS.ETH,
          balance: BigInt(ethBalance * 10**18),  // Convert to Wei
          formattedBalance: ethBalance.toFixed(4),
          price: ethPrice,
          value: ethBalance * ethPrice,
          change24h: fetchedPrices?.eth?.priceChange?.['24h'] || 0,
          marketCap: 'N/A', // Use string value instead of trying to access non-existent property
          volume24h: 'N/A', // Use string value instead of trying to access non-existent property
        });
      }
      
      // Add ERC20 tokens
      if (tokenData.tokenBalances && Array.isArray(tokenData.tokenBalances)) {
        for (const token of tokenData.tokenBalances) {
          if (token.token_address) {
            // Find token info from our known tokens or create a new entry
            const tokenAddress = token.token_address.toLowerCase();
            
            // Find matching token by address
            const knownToken = Object.values(allTokens).find(
              t => hasAddress(t) && t.address.toLowerCase() === tokenAddress
            ) as TokenInfo | undefined;
            
            // If token not in our list, create a new entry
            const tokenInfo: TokenInfo = knownToken || {
              symbol: token.symbol || 'Unknown',
              name: token.name || 'Unknown Token',
              decimals: token.decimals || 18,
              address: token.token_address,
              logo: token.logo || undefined
            };
            
            // Get price from our price feed or use default
            const priceInfo = fetchedPrices?.[tokenInfo.symbol.toLowerCase()];
            const price = priceInfo?.usdPrice || 0;
            const change24h = priceInfo?.priceChange?.['24h'] || 0;
            
            // Format balance based on decimals
            const tokenDecimals = token.decimals || tokenInfo.decimals;
            const rawBalance = BigInt(token.balance || '0');
            const formattedBalance = formatUnits(rawBalance, tokenDecimals);
            const numericBalance = Number(formattedBalance);
            
            // Calculate USD value
            const value = numericBalance * price;
            
            tokenBalances.push({
              token: tokenInfo,
              balance: rawBalance,
              formattedBalance: numericBalance.toFixed(4),
              price,
              value,
              change24h,
              marketCap: 'N/A', // Convert to string type
              volume24h: 'N/A',  // Convert to string type
            });
          }
        }
      }
      
      // Add NZT token only if in development environment or testnet
      // This ensures mock data only appears in non-production environments
      const isTestEnvironment = process.env.NODE_ENV === 'development' || 
                               (chainId && chainId !== 1 && chainId !== 56 && chainId !== 137);
      const hasNztToken = tokenBalances.some(t => t.token.symbol === 'NZT');

      if (isTestEnvironment && !hasNztToken) {
        // Only add mock NZT token on test networks or development
        tokenBalances.push({
          token: TOKENS.NZT,
          balance: BigInt(1000 * 10**18),
          formattedBalance: '1,000',
          price: 8.75,
          value: 8750,
          change24h: 15.2,
          marketCap: '875M',
          volume24h: '125M',
        });
      }
      
      setTokens(tokenBalances);
      
      // Calculate portfolio stats
      const totalValue = tokenBalances.reduce((sum: number, token) => sum + token.value, 0);
      const fiatValue = tokenBalances
        .filter(t => t.token.symbol === 'USDC' || t.token.symbol === 'USDT')
        .reduce((sum: number, token) => sum + token.value, 0);
      const weightedChange = tokenBalances.reduce(
        (sum: number, token) => sum + (token.change24h * token.value), 
        0
      ) / (totalValue || 1); // Prevent division by zero
      
      // Fetch NFT data using the new API route
      const nftResponse = await fetch(`/api/moralis/nfts?address=${address}&chain=${chainIdHex}&limit=5`);
      
      if (!nftResponse.ok) {
        throw new Error(`Failed to fetch NFTs: ${nftResponse.statusText}`);
      }
      
      const nftDataResponse = await nftResponse.json();
      const nftData = nftDataResponse.success ? nftDataResponse.data : { nfts: { result: [] } };
      
      // Calculate NFT value - try to use real data if available
      let estimatedNftValue = 0;
      const nftResults = nftData.nfts?.result || [];
      const nftCount = nftResults.length || 0;
      
      if (nftCount > 0 && nftData.stats?.trades) {
        // If we have trade data, use average price from recent trades
        try {
          const trades = nftData.stats.trades.result || [];
          if (trades.length > 0) {
            const totalTradeValue = trades.reduce((sum: number, trade: { price?: string }) => {
              return sum + (Number(trade.price) || 0);
            }, 0);
            const avgTradeValue = totalTradeValue / trades.length;
            estimatedNftValue = nftCount * avgTradeValue;
          } else {
            // Default fallback if no trade data
            const ethPrice = fetchedPrices?.eth?.usdPrice || 3500;
            estimatedNftValue = nftCount * 0.5 * ethPrice;
          }
        } catch (error) {
          console.warn('Error calculating NFT value from trades:', error);
          const ethPrice = fetchedPrices?.eth?.usdPrice || 3500;
          estimatedNftValue = nftCount * 0.5 * ethPrice;
        }
      } else {
        // Fallback to rough estimate
        const ethPrice = fetchedPrices?.eth?.usdPrice || 3500;
        estimatedNftValue = nftCount * 0.5 * ethPrice;
      }
      
      setPortfolio({
        totalValue,
        fiatValue,
        nftValue: estimatedNftValue,
        stakedValue: totalValue * 0.15, // Mock staked value as 15% of portfolio
        change24h: weightedChange,
        change24hUSD: totalValue * (weightedChange / 100),
      });
      
      // Fetch transaction history using the new API route
      const txResponse = await fetch(`/api/moralis/transactions?address=${address}&chain=${chainIdHex}&limit=10`);
      
      if (!txResponse.ok) {
        throw new Error(`Failed to fetch transactions: ${txResponse.statusText}`);
      }
      
      const txDataResponse = await txResponse.json();
      
      if (!txDataResponse.success) {
        throw new Error(txDataResponse.error || 'Failed to fetch transactions');
      }
      
      const txHistory = txDataResponse.data;
      
      // Format transactions
      const formattedTxs: Transaction[] = [];
      
      if (txHistory.transactions?.result && Array.isArray(txHistory.transactions.result)) {
        for (const tx of txHistory.transactions.result) {
          let type: Transaction['type'] = 'other';
          const token = 'ETH';
          
          if (tx.from_address && tx.to_address) {
            const isReceive = tx.to_address.toLowerCase() === address.toLowerCase();
            const isSend = tx.from_address.toLowerCase() === address.toLowerCase();
            
            // Determine transaction type
            if (isReceive) {
              type = 'receive';
            } else if (isSend) {
              type = 'send';
            }
            
            // Convert from wei to ETH for value
            const value = tx.value ? formatEther(BigInt(tx.value)) : '0';
            const formattedAmount = Number(value).toFixed(4);
            
            // Add to formatted transactions
            formattedTxs.push({
              id: tx.hash,
              hash: tx.hash,
              type,
              token,
              amount: formattedAmount,
              to: isReceive ? undefined : tx.to_address,
              from: isSend ? undefined : tx.from_address,
              status: tx.receipt_status === '1' ? 'completed' : 'failed',
              date: new Date(Number(tx.block_timestamp) * 1000).toISOString(),
            });
          }
        }
      }
      
      // Process token transfers if available
      if (txHistory.tokenTransfers?.result && Array.isArray(txHistory.tokenTransfers.result)) {
        for (const transfer of txHistory.tokenTransfers.result) {
          // Skip if hash already exists to avoid duplicates
          if (formattedTxs.some(tx => tx.hash === transfer.transaction_hash)) {
            continue;
          }
          
          let type: Transaction['type'] = 'other';
          const isReceive = transfer.to_address?.toLowerCase() === address.toLowerCase();
          const isSend = transfer.from_address?.toLowerCase() === address.toLowerCase();
          
          // Determine transaction type
          if (isReceive) {
            type = 'receive';
          } else if (isSend) {
            type = 'send';
          }
          
          // Find token info
          const tokenSymbol = transfer.symbol || 'Unknown';
          
          // Format amount based on token decimals
          const decimals = Number(transfer.decimals || 18);
          const rawAmount = BigInt(transfer.value || '0');
          const formattedValue = formatUnits(rawAmount, decimals);
          const numericAmount = Number(formattedValue);
          const formattedAmount = numericAmount.toFixed(4);
          
          // Add to formatted transactions
          formattedTxs.push({
            id: transfer.transaction_hash,
            hash: transfer.transaction_hash,
            type,
            token: tokenSymbol,
            amount: formattedAmount,
            to: isReceive ? undefined : transfer.to_address,
            from: isSend ? undefined : transfer.from_address,
            status: 'completed', // Assume completed for token transfers
            date: new Date(Number(transfer.block_timestamp) * 1000).toISOString(),
          });
        }
      }
      
      // Add mock transactions only in development or if no transactions found
      if (formattedTxs.length === 0 && isTestEnvironment) {
        formattedTxs.push({
          id: '0x1234...5678',
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          type: 'send',
          token: 'NZT',
          amount: '1,000',
          to: '0x8765...4321',
          status: 'completed',
          date: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
        });
      }
      
      setTransactions(formattedTxs);

      // Process approvals data
      const formattedApprovals: Approval[] = [];
      
      // Process real approvals data if available
      if (txHistory.approvals?.result && Array.isArray(txHistory.approvals.result)) {
        for (const approval of txHistory.approvals.result) {
          try {
            // Find token info
            const tokenSymbol = approval.symbol || 'Unknown';
            const spenderAddress = approval.spender;
            
            // Determine protocol name from spender address
            // In a real app, you'd have a mapping of known protocols
            let protocolName = 'Unknown Protocol';
            if (spenderAddress) {
              // Example mapping - in production, this should be a comprehensive list
              // You could fetch this from an API or database
              const protocolMap: Record<string, string> = {
                '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': 'Uniswap',
                '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap',
                '0xdef1c0ded9bec7f1a1670819833240f027b25eff': 'Ox Protocol',
                '0x1111111254fb6c44bac0bed2854e76f90643097d': '1inch',
                // Add more known protocol addresses
              };
              
              // Check if we know this protocol
              const lowerSpender = spenderAddress.toLowerCase();
              protocolName = Object.entries(protocolMap).find(
                ([addr]) => addr.toLowerCase() === lowerSpender
              )?.[1] || 'Unknown Protocol';
            }
            
            // Determine risk level based on allowance
            let risk: 'low' | 'medium' | 'high' = 'medium';
            const allowanceValue = approval.value || '0';
            
            // Check if this is an unlimited approval
            const isUnlimited = allowanceValue === '115792089237316195423570985008687907853269984665640564039457584007913129639935';
            
            if (isUnlimited) {
              risk = 'high';
            } else if (BigInt(allowanceValue) > BigInt(1000) * BigInt(10 ** 18)) {
              risk = 'medium';
            } else {
              risk = 'low';
            }
            
            // Format the allowance for display
            let allowanceFormatted: string;
            if (isUnlimited) {
              allowanceFormatted = 'Unlimited';
            } else {
              const decimals = Number(approval.decimals || 18);
              const formatted = formatUnits(BigInt(allowanceValue), decimals);
              allowanceFormatted = Number(formatted).toFixed(2);
            }
            
            // Calculate last used time
            let lastUsed = 'Unknown';
            if (approval.last_used_at) {
              const lastUsedDate = new Date(Number(approval.last_used_at) * 1000);
              const now = new Date();
              const diffMs = now.getTime() - lastUsedDate.getTime();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              
              if (diffDays > 30) {
                const diffMonths = Math.floor(diffDays / 30);
                lastUsed = `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
              } else if (diffDays > 0) {
                lastUsed = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
              } else {
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                lastUsed = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
              }
            }
            
            formattedApprovals.push({
              id: approval.transaction_hash || `approval-${approval.spender}-${tokenSymbol}`,
              protocol: protocolName,
              token: tokenSymbol,
              allowance: allowanceFormatted,
              lastUsed,
              risk,
            });
          } catch (error) {
            console.warn('Error processing approval:', error);
          }
        }
      }
      
      // Add mock approvals only in development or if no real approvals found
      if (formattedApprovals.length === 0 && isTestEnvironment) {
        formattedApprovals.push(
          {
            id: '0x1234...5678',
            protocol: 'NexSwap',
            token: 'NZT',
            allowance: 'Unlimited',
            lastUsed: '2 hours ago',
            risk: 'high',
          },
          {
            id: '0x8765...4321',
            protocol: 'NexStake',
            token: 'ETH',
            allowance: '1,000',
            lastUsed: '1 day ago',
            risk: 'medium',
          }
        );
      }
      
      setApprovals(formattedApprovals);
      
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      
      if (retryCount.current < MAX_RETRIES) {
        // Increment retry counter
        retryCount.current += 1;
        
        // Retry with exponential backoff
        setTimeout(() => {
          fetchWalletData();
        }, 1000 * (2 ** (retryCount.current - 1))); // 1s, 2s, 4s
        
        setConnectionState(CONNECTION_STATES.RECONNECTING);
      } else {
        // Max retries reached
        setConnectionState(CONNECTION_STATES.ERROR);
        // Ensure we always set an Error object
        setConnectionError(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      setIsLoadingBalance(false);
    }
  }, [address, isConnected, chainId, fetchedPrices, allTokens]);
  
  // Helper function to fetch ETH balance with optimized error handling
  const fetchEthBalance = async (walletAddress: `0x${string}`): Promise<string | null> => {
    try {
      // Try using wagmi hook data first (faster if cached)
      if (ethBalanceData?.value) {
        return formatEther(ethBalanceData.value);
      }
      
      // Fallback to manual fetch if hook data is not available
      const balance = await publicClient.getBalance({
        address: walletAddress,
      });
      
      return formatEther(balance);
    } catch (error) {
      // Don't log RPC errors with full stack trace to keep console clean
      console.error('Error fetching ETH balance:', 
        error instanceof Error ? error.message : 'Unknown error');
      
      // Set connection state if this is an RPC error
      if (error instanceof Error && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('network') || 
           error.message.includes('timeout'))) {
        // Consider updating connection state here if you track that
        // This helps UI show network connectivity issues
      }
      
      // Return '0' instead of null for better UX - shows as 0 ETH instead of completely failing
      return '0';
    }
  };
  
  // Format balance with appropriate precision
  const formatBalanceWithPrecision = (balance: string): string => {
    const numBalance = Number.parseFloat(balance);
    
    if (numBalance < 0.001) {
      return '<0.001 ETH';
    }
    
    if (numBalance < 1) {
      return `${numBalance.toFixed(4)} ETH`;
    }
    
    return `${numBalance.toFixed(2)} ETH`;
  };
  
  // Listen for new transactions to update balances
  useEffect(() => {
    if (!isConnected || !address) return;
    
    // Setup transaction watcher
    let cleanup: (() => void) | undefined;
    
    try {
      if (publicClient?.watchPendingTransactions) {
        cleanup = publicClient.watchPendingTransactions({
          onTransactions: () => {
            // Only refetch if we haven't fetched recently (past 5 seconds)
            const now = Date.now();
            const timeSinceLastFetch = lastSuccessfulFetch.current 
              ? now - lastSuccessfulFetch.current 
              : Number.POSITIVE_INFINITY;
              
            if (timeSinceLastFetch > 5000) {
              refetchEthBalance();
              fetchWalletData();
            }
          }
        });
      }
    } catch (error) {
      console.error('Error setting up transaction watcher:', error);
    }
    
    // Clean up
    return () => {
      if (cleanup) cleanup();
    };
  }, [address, isConnected, refetchEthBalance, fetchWalletData]);
  
  // Handle ENS resolution with error handling
  useEffect(() => {
    const getEnsName = async () => {
      if (!address || chainId !== mainnet.id) {
        setEnsName(undefined);
        return;
      }
      
      try {
        const name = await publicClient.getEnsName({
          address,
        });
        // Handle null return value from getEnsName
        setEnsName(name || undefined);
      } catch (error) {
        console.warn('Error fetching ENS name:', error instanceof Error ? error.message : 'Unknown error');
        setEnsName(undefined);
      }
    };
    
    getEnsName();
  }, [address, chainId]);

  // Function to add a custom token
  const addCustomToken = (token: TokenInfo) => {
    if (!address) {
      console.error("Cannot add token: No wallet connected");
      return;
    }
    
    setStoredCustomTokens((prev: Record<string, TokenInfo>) => ({
      ...prev,
      [token.address || token.symbol]: token
    }));
  };

  // Function to remove a custom token
  const removeCustomToken = (tokenAddressOrSymbol: string) => {
    if (!address) {
      console.error("Cannot remove token: No wallet connected");
      return;
    }
    
    setStoredCustomTokens((prev: Record<string, TokenInfo>) => {
      const updated = { ...prev };
      delete updated[tokenAddressOrSymbol];
      return updated;
    });
  };

  // Create dashboard format balances
  const dashboardBalances: DashboardTokenBalance[] = tokens.map(token => ({
    name: token.token.name,
    symbol: token.token.symbol,
    balance: typeof token.balance === 'bigint' ? Number(formatUnits(token.balance, token.token.decimals)) : token.balance,
    price: token.price,
    changePercentage: token.change24h,
    address: token.token.address
  }));

  // Create dashboard format activities
  const activities = transactions.map(tx => ({
    id: tx.id,
    type: tx.type,
    status: tx.status,
    amount: Number.parseFloat(tx.amount.replace(/,/g, '')),
    symbol: tx.token.split(' ')[0],
    timestamp: new Date(tx.date).getTime(),
    address: tx.to || tx.from,
  }));

  // Return expanded wallet data with connection state
  return {
    isLoading: isLoadingBalance,
    address: address?.toString(),
    ensName,
    tokens,
    balances: dashboardBalances, // Add this for dashboard compatibility
    activities, // Add this for dashboard compatibility
    portfolio,
    transactions,
    approvals,
    addCustomToken,
    removeCustomToken,
    customTokens: Object.values(storedCustomTokens),
    connectionState,
    connectionError,
    formattedEthBalance,
    ethBalance: walletEthBalance,
    isLoadingBalance,
    refetchWalletData: fetchWalletData,
    refetch: fetchWalletData,
    error: tokenPriceError,
  };
} 
