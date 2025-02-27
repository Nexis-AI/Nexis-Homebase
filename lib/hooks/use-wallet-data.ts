"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { useChainId } from 'wagmi';
import { mainnet } from 'viem/chains';
import { useTokenPrices, getTokenPriceFallback } from './use-token-prices';
import { useLocalStorage } from './use-local-storage';

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
  balance: bigint;
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

// Interface for the hook return value
export interface WalletData {
  isLoading: boolean;
  address?: string;
  ensName?: string;
  tokens: TokenBalance[];
  portfolio: PortfolioStats;
  transactions: Transaction[];
  approvals: Approval[];
  refetch: () => Promise<void>;
  addCustomToken: (token: TokenInfo) => void;
  removeCustomToken: (tokenAddressOrSymbol: string) => void;
  customTokens: TokenInfo[];
}

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

/**
 * Hook to fetch and manage wallet data including balances, transactions, and approvals
 */
export function useWalletData(): WalletData {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(true);
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
  
  // Generate a wallet-specific storage key to keep custom tokens separate per wallet
  const walletKey = address ? `nexis-custom-tokens-${address.toLowerCase()}` : 'nexis-custom-tokens';
  
  // Get custom tokens from localStorage using the wallet-specific key
  const [customTokens, setCustomTokens] = useLocalStorage<Record<string, TokenInfo>>(
    walletKey, 
    {}
  );

  // Combine default tokens with custom tokens
  const allTokens = { ...TOKENS, ...customTokens };
  
  // Extract token symbols for price fetching
  const tokenSymbols = Object.values(allTokens).map(token => token.symbol.toLowerCase());
  
  // Fetch real-time prices
  const { prices: tokenPrices, refreshPrices } = useTokenPrices(tokenSymbols);

  // Get ETH balance
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address,
  });

  // Function to add a custom token
  const addCustomToken = (token: TokenInfo) => {
    if (!address) {
      console.error("Cannot add token: No wallet connected");
      return;
    }
    
    setCustomTokens((prev: Record<string, TokenInfo>) => ({
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
    
    setCustomTokens((prev: Record<string, TokenInfo>) => {
      const updated = { ...prev };
      delete updated[tokenAddressOrSymbol];
      return updated;
    });
  };

  // Function to fetch and process wallet data
  const fetchWalletData = useCallback(async () => {
    if (!isConnected || !address) {
      // Clear data when wallet is disconnected
      setTokens([]);
      setPortfolio({
        totalValue: 0,
        fiatValue: 0,
        nftValue: 0,
        stakedValue: 0,
        change24h: 0,
        change24hUSD: 0,
      });
      setTransactions([]);
      setApprovals([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Start with ETH balance
      await refetchEthBalance();
      const tokenBalances: TokenBalance[] = [];

      if (ethBalance) {
        // Process ETH balance
        const ethPriceData = tokenPrices.eth || getTokenPriceFallback('eth');
        const ethPrice = ethPriceData.current_price || 3500;
        const ethValue = Number(formatUnits(ethBalance.value, 18)) * ethPrice;
        
        tokenBalances.push({
          token: TOKENS.ETH,
          balance: ethBalance.value,
          formattedBalance: formatUnits(ethBalance.value, 18),
          price: ethPrice,
          value: ethValue,
          change24h: ethPriceData.price_change_percentage_24h || 0,
          marketCap: formatMarketCap(ethPriceData.market_cap),
          volume24h: formatVolume(ethPriceData.total_volume),
        });
      } else {
        // Handle case when ethBalance fails to load
        console.warn('ETH balance could not be loaded, using fallback value');
        const ethPriceData = tokenPrices.eth || getTokenPriceFallback('eth');
        const ethPrice = ethPriceData.current_price || 3500;
        // Use mock balance for demonstration
        const mockEthBalance = BigInt('1000000000000000000'); // 1 ETH
        
        tokenBalances.push({
          token: TOKENS.ETH,
          balance: mockEthBalance,
          formattedBalance: '1.0',
          price: ethPrice,
          value: ethPrice,
          change24h: ethPriceData.price_change_percentage_24h || 0,
          marketCap: formatMarketCap(ethPriceData.market_cap),
          volume24h: formatVolume(ethPriceData.total_volume),
        });
      }

      // USDC - mock balance
      const usdcBalance = BigInt(5000_000000); // 5,000 USDC with 6 decimals
      const usdcPriceData = tokenPrices.usdc || getTokenPriceFallback('usdc');
      tokenBalances.push({
        token: TOKENS.USDC,
        balance: usdcBalance,
        formattedBalance: formatUnits(usdcBalance, 6),
        price: usdcPriceData.current_price || 1,
        value: 5000 * (usdcPriceData.current_price || 1),
        change24h: usdcPriceData.price_change_percentage_24h || 0,
        marketCap: formatMarketCap(usdcPriceData.market_cap),
        volume24h: formatVolume(usdcPriceData.total_volume),
      });
      
      // USDT - mock balance
      const usdtBalance = BigInt(2500_000000); // 2,500 USDT with 6 decimals
      const usdtPriceData = tokenPrices.usdt || getTokenPriceFallback('usdt');
      tokenBalances.push({
        token: TOKENS.USDT,
        balance: usdtBalance,
        formattedBalance: formatUnits(usdtBalance, 6),
        price: usdtPriceData.current_price || 1,
        value: 2500 * (usdtPriceData.current_price || 1),
        change24h: usdtPriceData.price_change_percentage_24h || 0,
        marketCap: formatMarketCap(usdtPriceData.market_cap),
        volume24h: formatVolume(usdtPriceData.total_volume),
      });
      
      // WBTC - mock balance
      const wbtcBalance = BigInt(25_000000); // 0.25 WBTC with 8 decimals
      const wbtcPriceData = tokenPrices.wbtc || getTokenPriceFallback('wbtc');
      tokenBalances.push({
        token: TOKENS.WBTC,
        balance: wbtcBalance,
        formattedBalance: formatUnits(wbtcBalance, 8),
        price: wbtcPriceData.current_price || 65000,
        value: 0.25 * (wbtcPriceData.current_price || 65000),
        change24h: wbtcPriceData.price_change_percentage_24h || 0,
        marketCap: formatMarketCap(wbtcPriceData.market_cap),
        volume24h: formatVolume(wbtcPriceData.total_volume),
      });
      
      // NZT - mock balance for the Nexis token
      const nztBalance = BigInt('25000000000000000000000'); // 25,000 NZT with 18 decimals
      tokenBalances.push({
        token: TOKENS.NZT,
        balance: nztBalance,
        formattedBalance: formatUnits(nztBalance, 18),
        price: 2.5, // Mock price for demo
        value: 62500,
        change24h: 5.67,
        marketCap: '250M',
        volume24h: '12.5M',
      });
      
      // Add any custom tokens with mock balances
      for (const [_, customToken] of Object.entries(customTokens)) {
        const token = customToken as TokenInfo;
        const customBalance = BigInt('1000000000000000000000'); // 1,000 tokens with 18 decimals
        const tokenSymbol = token.symbol.toLowerCase();
        const priceData = tokenPrices[tokenSymbol] || { current_price: 1, price_change_percentage_24h: 0 };
        
        tokenBalances.push({
          token,
          balance: customBalance,
          formattedBalance: formatUnits(customBalance, token.decimals),
          price: priceData.current_price || 1,
          value: 1000 * (priceData.current_price || 1),
          change24h: priceData.price_change_percentage_24h || 0,
          marketCap: formatMarketCap(priceData.market_cap),
          volume24h: formatVolume(priceData.total_volume),
        });
      }

      setTokens(tokenBalances);

      // Calculate portfolio statistics
      const totalValue = tokenBalances.reduce((sum, token) => sum + token.value, 0);
      // In a real app, get actual fiat vs NFT vs staked breakdowns
      const fiatValue = tokenBalances
        .filter(t => t.token.symbol === 'USDC' || t.token.symbol === 'USDT')
        .reduce((sum, token) => sum + token.value, 0);
      const nftValue = 28200; // Mock NFT value
      const stakedValue = 4800; // Mock staked value
      
      // Calculate 24h change
      const weightedChange = tokenBalances.reduce(
        (sum, token) => sum + (token.change24h * token.value), 
        0
      ) / totalValue;
      
      const change24hUSD = totalValue * (weightedChange / 100);

      setPortfolio({
        totalValue,
        fiatValue,
        nftValue,
        stakedValue,
        change24h: weightedChange,
        change24hUSD: change24hUSD,
      });

      // In a real app, fetch actual transactions from an API or blockchain
      // For demo purposes, create mock transactions
      const mockTransactions: Transaction[] = [
        {
          id: '0x1234...5678',
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          type: 'send',
          token: 'NZT',
          amount: '1,000',
          to: '0x8765...4321',
          status: 'completed',
          date: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
        },
        {
          id: '0x8765...4321',
          hash: '0x8765432109fedcba8765432109fedcba8765432109fedcba8765432109fedcba',
          type: 'receive',
          token: 'ETH',
          amount: '0.5',
          from: '0x9876...2468',
          status: 'pending',
          date: new Date(Date.now() - 35 * 60000).toISOString(), // 35 minutes ago
        },
        {
          id: '0x9876...2468',
          hash: '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef',
          type: 'swap',
          token: 'USDT → NZT',
          amount: '500',
          status: 'completed',
          date: new Date(Date.now() - 40 * 60000).toISOString(), // 40 minutes ago
        },
      ];
      setTransactions(mockTransactions);

      // In a real app, fetch actual approvals from an API or blockchain
      // For demo purposes, create mock approvals
      const mockApprovals: Approval[] = [
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
        },
        {
          id: '0x9876...2468',
          protocol: 'NexBridge',
          token: 'USDT',
          allowance: '10,000',
          lastUsed: '3 days ago',
          risk: 'low',
        },
      ];
      setApprovals(mockApprovals);
      
      // Set mock ENS name if on mainnet
      if (chainId === mainnet.id) {
        setEnsName('nexis.eth');
      } else {
        setEnsName(undefined);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    address, 
    isConnected, 
    chainId, 
    ethBalance, 
    refetchEthBalance, 
    tokenPrices, 
    customTokens
  ]);

  // Fetch data when wallet connection changes
  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // Return updated wallet data including custom token management
  return {
    isLoading,
    address: address?.toString(),
    ensName,
    tokens,
    portfolio,
    transactions,
    approvals,
    refetch: async () => {
      await refreshPrices();
      await fetchWalletData();
    },
    addCustomToken,
    removeCustomToken,
    customTokens: Object.values(customTokens),
  };
} 