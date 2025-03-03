"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  ChevronDown,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  BarChart2,
  Wallet,
  Check,
  XCircle,
  RefreshCw,
  AlertCircle,
  Receipt,
  Image as ImageIcon,
  Percent,
  Shield,
  PieChart,
  DollarSign as USDIcon,
  FlameIcon,
  TrendingUp as GrowthIcon,
  ArrowUp,
  Copy,
  LogOut,
  Search,
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { TokenChart } from "./components/token-chart"
import { generateChartData } from "./utils/generate-chart-data"
import { SendTokenModal as SendModal } from "./components/send-token-modal"
import { ReceiveTokenModal as ReceiveModal } from "./components/receive-token-modal"
import { WalletInfo } from "./components/wallet-info"
import { CustomTokens } from "./components/custom-tokens"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokenInfo, TokenBalance as WalletTokenBalance } from "@/lib/hooks/use-wallet-data"
import { Skeleton } from "@/components/ui/skeleton"
import { useAccount } from "wagmi"
import { Loader2 } from "lucide-react"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { AlertDialogCancel } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { useMoralisData } from "@/lib/hooks/use-moralis-data";
import { Badge } from "@/components/ui/badge";
import { PortfolioSection } from "./components/portfolio-section";
import { ActivitySection } from "./components/activity-section";
import { ApprovalSection } from "./components/approval-section";
import { PnLTab } from "./components/pnl-tab";
import { NFTsTab } from "./components/nfts-tab";
import { formatUnits } from "ethers";
import { MoralisStatus } from "./components/moralis-status";
import MultiChainPortfolio from "./components/multi-chain-portfolio";
import TokenList from "./components/token-list";
import { TransactionHistory } from "./components/transaction-history";
import { NftGallery } from "./components/nft-gallery";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { ProfitLossChart } from "./components/profit-loss-chart"
import { ConnectionErrorAlert } from "@/components/wallet-connect-button";
import { useWalletConnection } from "@/lib/hooks/use-wallet-connection";
import { useTokenPrices } from "@/lib/hooks/use-token-prices";
import { Input } from "@/components/ui/input";
import { PortfolioChart } from "./components/portfolio-chart";
import type { TokenData } from "@/lib/portfolio-service";

// Define the Moralis transaction interface
interface MoralisTransaction {
  hash: string;
  from_address: string;
  to_address: string;
  value: string;
  block_timestamp: string;
}

// Define the token balance interface - override TokenData properties as needed
interface TokenBalance extends TokenData {
  name: string;
  symbol: string;
  changePercentage: number;
  price?: number;
  logoUrl?: string;
  allocationPercentage?: number;
  historicalData?: Array<{
    timestamp: number;
    price: number;
  }>;
  chain?: string;
  formattedBalance?: string;
  priceChange24h?: number;
}

// Define the Moralis approval interface
interface DashboardApproval {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  logoUrl?: string;
  spender: string;
  allowance: number;
  status: string;
  riskLevel?: 'low' | 'medium' | 'high';
  lastUsed?: string;
}

// Define DeFi position interface
interface DeFiPosition {
  id: string;
  protocol: string;
  protocolLogo?: string;
  type: string;
  asset: string;
  assetLogo?: string;
  balance: number;
  value: number;
  apy?: number;
  rewards?: {
    token: string;
    tokenLogo?: string;
    amount: number;
    value: number;
  }[];
  healthFactor?: number;
  borrowed?: {
    asset: string;
    assetLogo?: string;
    amount: number;
    value: number;
    apr: number;
  }[];
}

// Mock data for demonstration
const mockPortfolioData = {
  totalValue: 12456.78,
  dailyChange: 234.56,
  dailyChangePercentage: 1.92,
  weeklyChange: -123.45,
  weeklyChangePercentage: -0.98,
  monthlyChange: 567.89,
  monthlyChangePercentage: 4.78,
  allTimeProfit: 3456.78,
  allTimeProfitPercentage: 38.45,
  assetAllocation: [
    { category: 'Stable Coins', percentage: 35 },
    { category: 'Ethereum Ecosystem', percentage: 25 },
    { category: 'DeFi Tokens', percentage: 20 },
    { category: 'Gaming/NFT', percentage: 15 },
    { category: 'Other', percentage: 5 },
  ],
  chainDistribution: [
    { chain: 'Ethereum', percentage: 45 },
    { chain: 'Polygon', percentage: 30 },
    { chain: 'BSC', percentage: 15 },
    { chain: 'Solana', percentage: 10 },
  ]
};

// Mock token balances with more detailed data
const mockTokenBalances: TokenBalance[] = [
  {
    name: 'Ethereum',
    symbol: 'ETH',
    balance: 1.25,
    price: 3500.23,
    changePercentage: 2.5,
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    priceChange24h: 85.42,
    value: 4375.29,
    allocationPercentage: 35.12,
    logoUrl: '/tokens/ethereum.svg',
    historicalData: Array(30).fill(0).map((_, i) => ({
      timestamp: Date.now() - (29 - i) * 86400000,
      price: 3200 + Math.random() * 800
    }))
  },
  {
    name: 'USD Coin',
    symbol: 'USDC',
    balance: 2500,
    price: 1.00,
    changePercentage: 0.01,
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6,
    priceChange24h: 0.001,
    value: 2500,
    allocationPercentage: 20.07,
    logoUrl: '/tokens/usdc.svg',
    historicalData: Array(30).fill(0).map((_, i) => ({
      timestamp: Date.now() - (29 - i) * 86400000,
      price: 0.995 + Math.random() * 0.01
    }))
  },
  {
    name: 'Nexis Network',
    symbol: 'NEXIS',
    balance: 15000,
    price: 0.32,
    changePercentage: 5.2,
    address: '0x1234567890abcdef1234567890abcdef12345678',
    decimals: 18,
    priceChange24h: 0.016,
    value: 4800,
    allocationPercentage: 38.54,
    logoUrl: '/tokens/nexis.svg',
    historicalData: Array(30).fill(0).map((_, i) => ({
      timestamp: Date.now() - (29 - i) * 86400000,
      price: 0.28 + Math.random() * 0.08
    }))
  },
  {
    name: 'Polygon',
    symbol: 'MATIC',
    balance: 2000,
    price: 0.42,
    changePercentage: -1.8,
    address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
    decimals: 18,
    priceChange24h: -0.008,
    value: 840,
    allocationPercentage: 6.74,
    logoUrl: '/tokens/polygon.svg',
    historicalData: Array(30).fill(0).map((_, i) => ({
      timestamp: Date.now() - (29 - i) * 86400000,
      price: 0.38 + Math.random() * 0.1
    }))
  },
];

// Mock approval data
const mockApprovals: DashboardApproval[] = [
  {
    id: '1',
    tokenName: 'Ethereum',
    tokenSymbol: 'ETH',
    logoUrl: '/tokens/ethereum.svg',
    spender: '0xUniswap_Router_V2',
    allowance: Number.POSITIVE_INFINITY,
    status: 'active',
    riskLevel: 'medium',
    lastUsed: '2023-11-15'
  },
  {
    id: '2',
    tokenName: 'USD Coin',
    tokenSymbol: 'USDC',
    logoUrl: '/tokens/usdc.svg',
    spender: '0xAave_V3_Pool',
    allowance: 1000,
    status: 'active',
    riskLevel: 'low',
    lastUsed: '2023-12-01'
  },
  {
    id: '3',
    tokenName: 'Nexis Network',
    tokenSymbol: 'NEXIS',
    logoUrl: '/tokens/nexis.svg',
    spender: '0xUnknown_Contract',
    allowance: Number.POSITIVE_INFINITY,
    status: 'active',
    riskLevel: 'high',
    lastUsed: '2023-10-30'
  }
];

// Mock DeFi positions
const mockDefiPositions: DeFiPosition[] = [
  {
    id: '1',
    protocol: 'Aave',
    protocolLogo: '/protocols/aave.svg',
    type: 'Lending',
    asset: 'USDC',
    assetLogo: '/tokens/usdc.svg',
    balance: 1000,
    value: 1000,
    apy: 3.2,
    healthFactor: 1.8,
    borrowed: [
      {
        asset: 'ETH',
        assetLogo: '/tokens/ethereum.svg',
        amount: 0.1,
        value: 350,
        apr: 1.2
      }
    ]
  },
  {
    id: '2',
    protocol: 'Uniswap',
    protocolLogo: '/protocols/uniswap.svg',
    type: 'Liquidity',
    asset: 'ETH-USDC',
    assetLogo: '/tokens/eth-usdc.svg',
    balance: 0.5,
    value: 1750,
    apy: 12.4,
    rewards: [
      {
        token: 'UNI',
        tokenLogo: '/tokens/uniswap.svg',
        amount: 10,
        value: 45
      }
    ]
  },
  {
    id: '3',
    protocol: 'Nexis Staking',
    protocolLogo: '/tokens/nexis.svg',
    type: 'Staking',
    asset: 'NEXIS',
    assetLogo: '/tokens/nexis.svg',
    balance: 5000,
    value: 1600,
    apy: 8.5,
    rewards: [
      {
        token: 'NEXIS',
        tokenLogo: '/tokens/nexis.svg',
        amount: 125,
        value: 40
      }
    ]
  }
];

// Define interfaces for chart data
interface ChartTokenData {
  date: string;
  price: number;
}

// Define interfaces for modal props
interface SendTokenType {
  symbol: string;
  name: string;
  balance: string;
  price: number;
  decimals: number;
}

interface ReceiveTokenType {
  symbol: string;
  name: string;
  address?: string;
}

export default function DashboardPage() {
  const [openSendModal, setOpenSendModal] = useState(false);
  const [openReceiveModal, setOpenReceiveModal] = useState(false);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<"24h" | "7d" | "30d" | "all">("30d");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [hasRpcError, setHasRpcError] = useState(false);

  // Get wallet connection state
  const {
    isConnected,
    isInitialized,
    isLoading: walletIsLoading,
    isConnecting,
    walletAddress: address,
    disconnect: disconnectWallet,
    connect: connectWallet
  } = useWalletConnection();

  // Fix hydration issues - run this first
  useEffect(() => {
    setIsClient(true);
  }, []);

  // For debugging connection state
  useEffect(() => {
    console.log("Wallet connection state:", { 
      isConnected, 
      address: address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : null, 
      walletIsLoading,
      isConnecting,
      isClient
    });
    
    // When successfully connected, reset RPC error state
    if (isConnected && address) {
      setHasRpcError(false);
    }
  }, [isConnected, address, walletIsLoading, isConnecting, isClient]);

  // Use Moralis data for the connected wallet
  const { 
    allTokens, 
    allNfts, 
    allTransactions, 
    allTokenTransfers, 
    isLoading: moralisDataLoading,
    totalBalanceUsd,
    error: moralisError,
    refetch: refetchMoralisData,
    getPortfolioHistory
  } = useMoralisData({
    enabled: !!isConnected && !!address,
    refreshInterval: 60000, // Refresh every minute
  });

  // Get token addresses for price fetching
  const tokenAddresses = useMemo(() => 
    allTokens
      .filter(token => token.token_address)
      .map(token => token.token_address)
      .concat([
        // Add default tokens to track across chains
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
        '0xB8c77482e45F1F44dE1745F52C74426C631bDD52'  // BNB
      ]),
    [allTokens]
  );

  // Fetch token prices
  const { 
    prices, 
    getUsdPrice, 
    getUsdValue, 
    getPriceChange,
    isLoading: pricesLoading 
  } = useTokenPrices(tokenAddresses);

  // Format wallet tokens to include price data
  const formattedTokenBalances = useMemo<TokenBalance[]>(() => {
    if (!allTokens?.length) return [];
    
    return allTokens.map(token => {
      const tokenAddress = token.token_address.toLowerCase();
      const decimals = token.decimals || 18;
      const balance = Number.parseFloat(token.balance) / (10 ** decimals);
      const usdPrice = getUsdPrice(tokenAddress) || 0;
      const value = balance * usdPrice;
      const priceChange24h = getPriceChange(tokenAddress, '24h') || 0;
      
      // Calculate allocation percentage
      const allocation = totalBalanceUsd > 0 ? (value / totalBalanceUsd * 100) : 0;
      
      return {
        name: token.name || 'Unknown Token',
        symbol: token.symbol || '???',
        balance,
        price: usdPrice,
        changePercentage: priceChange24h,
        address: token.token_address,
        decimals: decimals,
        value,
        allocationPercentage: allocation,
        logoUrl: token.logo || `/tokens/${token.symbol?.toLowerCase()}.svg`,
        historicalData: [] // Will be populated with historical price data if available
      };
    })
    .filter(token => token.balance > 0 || token.value > 1); // Filter out dust tokens
  }, [allTokens, getUsdPrice, getPriceChange, totalBalanceUsd]);

  // Sort by value (highest first)
  const sortedTokens = useMemo(() => {
    return [...formattedTokenBalances].sort((a, b) => (b.value || 0) - (a.value || 0));
  }, [formattedTokenBalances]);

  // Top 10 tokens by value
  const topTokens = useMemo(() => sortedTokens.slice(0, 10), [sortedTokens]);

  // Get portfolio history for chart
  const [portfolioHistory, setPortfolioHistory] = useState<Array<{date: string, value: number}>>([]);
  const [portfolioHistoryLoading, setPortfolioHistoryLoading] = useState(false);
  const [portfolioHistoryError, setPortfolioHistoryError] = useState<string | null>(null);

  // Fetch portfolio history based on selected timeframe
  useEffect(() => {
    if (!address) return;

    const fetchPortfolioHistory = async () => {
      setPortfolioHistoryLoading(true);
      setPortfolioHistoryError(null);
      
      try {
        // Convert timeframe to days
        const days = selectedTimeframe === '24h' ? 1 : 
                   selectedTimeframe === '7d' ? 7 : 
                   selectedTimeframe === '30d' ? 30 : 
                   selectedTimeframe === 'all' ? 365 : 90;
        
        // Get chain from first token or default to Ethereum
        const primaryChain = allTokens.length > 0 ? allTokens[0].chain : '0x1';
        
        // Fetch portfolio history data
        const historyData = await getPortfolioHistory(address, days, primaryChain);
        
        if (!historyData || !historyData.history || historyData.history.length === 0) {
          setPortfolioHistoryError("No historical data available");
          setPortfolioHistory([]);
          return;
        }
        
        // Format the data for the chart
        const formattedHistory = historyData.history.map((item: { date?: string; value?: number }) => {
          // Ensure date is in ISO string format
          const dateStr = typeof item.date === 'string' ? item.date : new Date().toISOString().split('T')[0];
          
          return {
            date: dateStr,
            value: typeof item.value === 'number' ? item.value : 0
          };
        });
        
        // Set the portfolio history state
        setPortfolioHistory(formattedHistory);
        
        // Log for debugging
        console.log(`Loaded ${formattedHistory.length} portfolio history data points for timeframe: ${selectedTimeframe}`);
      } catch (error) {
        console.error("Error fetching portfolio history:", error);
        setPortfolioHistoryError("Failed to load portfolio history");
        setPortfolioHistory([]);
      } finally {
        setPortfolioHistoryLoading(false);
      }
    };

    fetchPortfolioHistory();
  }, [address, selectedTimeframe, getPortfolioHistory, allTokens]);

  // Calculate all-time profit/loss
  const [allTimeProfit, setAllTimeProfit] = useState<number>(0);
  const [allTimeProfitPercentage, setAllTimeProfitPercentage] = useState<number>(0);

  useEffect(() => {
    if (portfolioHistory.length > 1) {
      const firstValue = portfolioHistory[0]?.value || 0;
      const currentValue = totalBalanceUsd || portfolioHistory[portfolioHistory.length - 1]?.value || 0;
      const profit = currentValue - firstValue;
      const percentage = firstValue > 0 ? (profit / firstValue) * 100 : 0;
      
      setAllTimeProfit(profit);
      setAllTimeProfitPercentage(percentage);
    }
  }, [portfolioHistory, totalBalanceUsd]);

  // Calculate period changes
  const calculatePeriodChange = useCallback((period: number): { change: number, percentage: number } => {
    if (portfolioHistory.length <= period) {
      return { change: 0, percentage: 0 };
    }
    
    const currentValue = totalBalanceUsd || portfolioHistory[portfolioHistory.length - 1]?.value || 0;
    const pastValue = portfolioHistory[portfolioHistory.length - 1 - period]?.value || 0;
    const change = currentValue - pastValue;
    const percentage = pastValue > 0 ? (change / pastValue) * 100 : 0;
    
    return { change, percentage };
  }, [portfolioHistory, totalBalanceUsd]);

  const dailyChange = useMemo(() => calculatePeriodChange(1), [calculatePeriodChange]);
  const weeklyChange = useMemo(() => calculatePeriodChange(7), [calculatePeriodChange]);
  const monthlyChange = useMemo(() => calculatePeriodChange(30), [calculatePeriodChange]);

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery) return sortedTokens;
    
    const query = searchQuery.toLowerCase();
    return sortedTokens.filter(token => 
      token.name.toLowerCase().includes(query) || 
      token.symbol.toLowerCase().includes(query) ||
      token.address?.toLowerCase().includes(query)
    );
  }, [searchQuery, sortedTokens]);

  // Custom token search handler
  const handleSearchToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    // Search for token and add to watchlist functionality would go here
    toast({
      title: "Searching for token",
      description: `Looking up ${searchQuery}...`,
    });
    
    // Implement custom token search logic here
  };

  // Demo token approvals data (in a real implementation, this would come from Moralis)
  const tokenApprovals: DashboardApproval[] = allTokens
    .slice(0, 5)
    .map((token, index) => ({
      id: `approval-${index}`,
      tokenName: token.name,
      tokenSymbol: token.symbol,
      logoUrl: token.logo,
      spender: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap router
      allowance: index === 0 ? Number.POSITIVE_INFINITY : (index + 1) * 1000,
      status: 'active',
      riskLevel: index === 0 ? 'high' : index < 3 ? 'medium' : 'low',
      lastUsed: new Date(Date.now() - index * 86400000).toISOString(),
    }));

  // Format for transaction display
  const formattedTransactions = useMemo(() => {
    return allTransactions
      .slice(0, 50)
      .map(tx => ({
        hash: tx.hash,
        from_address: tx.from_address,
        to_address: tx.to_address,
        value: tx.value,
        block_timestamp: tx.block_timestamp,
        chain: tx.chain,
        chainName: tx.chainName
      }));
  }, [allTransactions]);

  const isDataLoading = walletIsLoading || isConnecting || moralisDataLoading || pricesLoading;
  
  // Log connection state for debugging
  useEffect(() => {
    console.log("Wallet connection state:", { isConnected, address, walletIsLoading });
    console.log("Moralis data:", { 
      tokensLoaded: allTokens.length,
      nftsLoaded: allNfts.length,
      transactionsLoaded: allTransactions.length,
      totalBalance: totalBalanceUsd,
      isLoading: moralisDataLoading
    });
  }, [isConnected, address, walletIsLoading, allTokens, allNfts, allTransactions, totalBalanceUsd, moralisDataLoading]);

  // Handle connection errors
  useEffect(() => {
    const handleConnectionErrors = (event: ErrorEvent) => {
      if (event.message?.includes('Unknown response Objectid') || 
          event.message?.includes('BLANK_BACKGROUND')) {
        console.error("Wallet connection error detected:", event.message);
        setConnectionError(event.message);
        
        toast({
          title: "Wallet connection issue detected",
          description: "There was a problem with your wallet connection. Please try reconnecting.",
          variant: "destructive"
        });
      }
      
      // Detect RPC-related errors
      if (event.message?.includes('cannot get chain') || 
          event.message?.includes('network error') ||
          event.message?.includes('Failed to fetch') ||
          event.message?.includes('invalid RPC response')) {
        setHasRpcError(true);
      }
    };

    window.addEventListener('error', handleConnectionErrors);
    
    return () => {
      window.removeEventListener('error', handleConnectionErrors);
    };
  }, []);

  // Handle token interaction
  const handleTokenSelect = (token: TokenBalance, action: "send" | "receive") => {
    setSelectedToken(token);
    if (action === "send") {
      setOpenSendModal(true);
    } else {
      setOpenReceiveModal(true);
    }
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(value);
  };

  // Format percentage for display
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Return early if we're not on the client yet
  if (!isClient) {
    return null;
  }

  // If wallet is not connected, show connection UI
  if (!isConnected) {
    return (
      <div className="container mx-auto p-4 space-y-8 mt-8">
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
          <div className="bg-muted/30 rounded-full p-6">
            <Wallet className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2 max-w-lg">
            <h1 className="text-3xl font-bold tracking-tight">Connect Your Wallet</h1>
            <p className="text-muted-foreground">
              Connect your wallet to view your portfolio, tokens, NFTs, and transaction history across multiple chains.
            </p>
          </div>
          
          <div className="flex flex-col w-full max-w-xs gap-2 mt-4">
            <Button 
              onClick={connectWallet} 
              size="lg" 
              disabled={walletIsLoading || !isInitialized}
              className="w-full"
            >
              {walletIsLoading ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Connecting...
                </>
              ) : (
                <>
                  <ArrowUpRight className="mr-2 h-4 w-4" /> 
                  Connect Wallet
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-2">
              Supported: MetaMask, Coinbase Wallet, WalletConnect, and more
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="mr-2 h-5 w-5 text-primary" />
                Multi-Chain Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track your assets across Ethereum, Polygon, BSC, Arbitrum, and other EVM chains in one unified dashboard.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="mr-2 h-5 w-5 text-primary" />
                NFT Gallery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                View, manage, and track your NFT collection with detailed metadata and floor price information.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-primary" />
                Token Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Secure your wallet by monitoring and managing token approvals with risk assessment and easy revocation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading state while fetching initial data
  if (isDataLoading && !formattedTokenBalances.length) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Loading Dashboard</h1>
            <p className="text-muted-foreground">
              Fetching your portfolio data...
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 bg-muted/20 p-4 rounded-lg">
          <LucideIcons.Loader2 className="h-6 w-6 animate-spin text-primary" />
          <div>
            <p className="font-medium">Retrieving your wallet data</p>
            <p className="text-sm text-muted-foreground">This may take a moment for wallets with many assets</p>
          </div>
        </div>
        
        {/* Skeleton loaders for portfolio cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {Array(4).fill(0).map((_, i) => (
            <Card key={`skeleton-card-${i}-${Date.now()}`}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Skeleton for the table */}
        <Card className="mt-8">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={`skeleton-row-${i}-${Date.now()}`} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Main dashboard content when wallet is connected and data is loaded
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Connection alert if there's a wallet connection error */}
      {connectionError && <ConnectionErrorAlert />}
      
      {/* Network alert for mainnet switch */}
      {hasRpcError && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-md p-4 flex items-start mb-4">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Network Connection Issue</h3>
            <p className="text-sm text-muted-foreground">
              There was a problem connecting to the network. Please switch to Ethereum Mainnet in your wallet.
            </p>
          </div>
        </div>
      )}
    
      {/* Dashboard Header with controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Multi-Chain Portfolio</h1>
          <p className="text-muted-foreground flex items-center">
            Connected: {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'Unknown'}
            <Button variant="ghost" size="icon" className="ml-1 h-5 w-5" onClick={() => {
              if (address) {
                navigator.clipboard.writeText(address);
                toast({
                  title: "Address copied",
                  description: "Wallet address copied to clipboard"
                });
              }
            }}>
              <Copy className="h-3 w-3" />
            </Button>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpenSendModal(true)}>
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Send
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOpenReceiveModal(true)}>
            <ArrowDownLeft className="h-4 w-4 mr-2" />
            Receive
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetchMoralisData()}>
            <RefreshCw className={`h-4 w-4 mr-2 ${moralisDataLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={disconnectWallet}>
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </div>
      
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isDataLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(totalBalanceUsd || 0)
              )}
            </div>
            <div className="flex items-center mt-1">
              <Badge variant={dailyChange.percentage >= 0 ? "default" : "destructive"} className="mr-2">
                {dailyChange.percentage >= 0 ? 
                  <TrendingUp className="h-3 w-3 mr-1" /> : 
                  <TrendingDown className="h-3 w-3 mr-1" />}
                {formatPercentage(dailyChange.percentage)}
              </Badge>
              <span className="text-xs text-muted-foreground">24h</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">All-Time Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isDataLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(allTimeProfit || 0)
              )}
            </div>
            <div className="flex items-center mt-1">
              <Badge variant={allTimeProfitPercentage >= 0 ? "default" : "destructive"} className="mr-2">
                {allTimeProfitPercentage >= 0 ? 
                  <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                  <ArrowDownLeft className="h-3 w-3 mr-1" />}
                {formatPercentage(allTimeProfitPercentage)}
              </Badge>
              <span className="text-xs text-muted-foreground">Since inception</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isDataLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                `${formattedTokenBalances.length + allNfts.length}`
              )}
            </div>
            <div className="flex items-center mt-1">
              <span className="text-xs text-muted-foreground">
                {formattedTokenBalances.length} tokens, {allNfts.length} NFTs
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isDataLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                // Count unique chains from tokens
                new Set([
                  ...allTokens.map(t => t.chain || ''),
                  ...allNfts.map(n => n.chain || '')
                ]).size
              )}
            </div>
            <div className="flex items-center mt-1 space-x-1">
              <div className="flex -space-x-2">
                {['ethereum', 'polygon', 'bsc', 'arbitrum'].map((chain) => (
                  <div 
                    key={chain}
                    className="h-4 w-4 rounded-full bg-primary/80 border border-background" 
                    title={chain}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-2">Connected networks</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Tab Navigation */}
      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-5 mb-6">
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span>Portfolio</span>
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span>Tokens</span>
          </TabsTrigger>
          <TabsTrigger value="nfts" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span>NFTs</span>
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Approvals</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          {/* Portfolio Chart */}
          <Card>
            <CardHeader>
              <div className="h-[400px]">
                <PortfolioChart />
              </div>
            </CardHeader>
          </Card>
          
          {/* Asset Allocation & Chain Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
                <CardDescription>Breakdown of your portfolio by value</CardDescription>
              </CardHeader>
              <CardContent>
                {isDataLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-10" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : formattedTokenBalances.length > 0 ? (
                  <div className="space-y-4">
                    {sortedTokens.slice(0, 5).map((token, i) => (
                      <div key={`token-${token.address || i}`}>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            {token.logoUrl && (
                              <div className="w-5 h-5 mr-2 rounded-full overflow-hidden bg-background">
                                <Image 
                                  src={token.logoUrl} 
                                  alt={token.name}
                                  width={20}
                                  height={20}
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <span className="text-sm">{token.symbol}</span>
                          </div>
                          <span className="text-sm font-medium">{(token.allocationPercentage || 0).toFixed(2)}%</span>
                        </div>
                        <Progress value={token.allocationPercentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center">
                    <p className="text-muted-foreground">No tokens found in your wallet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Tokens</CardTitle>
                <CardDescription>Your highest value assets</CardDescription>
              </CardHeader>
              <CardContent>
                {isDataLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : topTokens.length > 0 ? (
                  <div className="space-y-3">
                    {topTokens.slice(0, 5).map((token, i) => (
                      <div 
                        key={`top-${token.address || i}`}
                        className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center flex-1">
                          <div className="w-8 h-8 mr-3 rounded-full overflow-hidden bg-background flex items-center justify-center">
                            {token.logoUrl ? (
                              <Image 
                                src={token.logoUrl} 
                                alt={token.name}
                                width={32}
                                height={32}
                                className="object-cover"
                              />
                            ) : (
                              <Wallet className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-xs text-muted-foreground">{token.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(token.value || 0)}</div>
                          <div className={`text-xs ${token.changePercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatPercentage(token.changePercentage)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center">
                    <p className="text-muted-foreground">No tokens found in your wallet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tokens Tab */}
        <TabsContent value="tokens" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div>
                <CardTitle>Token Balances</CardTitle>
                <CardDescription>Your tokens across all chains</CardDescription>
              </div>
              <div className="ml-auto">
                <form onSubmit={handleSearchToken}>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search tokens..."
                      className="pl-8 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </form>
              </div>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredTokens.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">24h Change</TableHead>
                        <TableHead aria-hidden="true" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTokens.map((token) => (
                        <TableRow key={`token-${token.address || token.symbol}`}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-8 h-8 mr-3 rounded-full overflow-hidden bg-background flex items-center justify-center">
                                {token.logoUrl ? (
                                  <Image 
                                    src={token.logoUrl} 
                                    alt={token.name}
                                    width={32}
                                    height={32}
                                    className="object-cover"
                                  />
                                ) : (
                                  <Wallet className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{token.symbol}</div>
                                <div className="text-xs text-muted-foreground">{token.name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {token.balance.toFixed(token.balance < 0.01 ? 6 : 4)}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(token.price || 0)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(token.value || 0)}</TableCell>
                          <TableCell className="text-right">
                            <span className={token.changePercentage >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {formatPercentage(token.changePercentage)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleTokenSelect(token, "send")}
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleTokenSelect(token, "receive")}
                              >
                                <ArrowDownLeft className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center">
                  <p className="text-muted-foreground mb-2">No tokens found</p>
                  {searchQuery && (
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                      Clear search
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* NFTs Tab */}
        <TabsContent value="nfts" className="space-y-6">
          <NftGallery 
            allNfts={allNfts} 
            isLoading={isDataLoading} 
          />
        </TabsContent>
        
        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Token Approvals</CardTitle>
              <CardDescription>
                Manage smart contract approvals for your tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : tokenApprovals.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                        <TableHead>Spender</TableHead>
                        <TableHead>Allowance</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead aria-hidden="true" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tokenApprovals.map((approval) => (
                        <TableRow key={approval.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-8 h-8 mr-3 rounded-full overflow-hidden bg-background flex items-center justify-center">
                                {approval.logoUrl ? (
                                  <Image 
                                    src={approval.logoUrl} 
                                    alt={approval.tokenSymbol}
                                    width={32}
                                    height={32}
                                    className="object-cover"
                                  />
                                ) : (
                                  <Wallet className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{approval.tokenSymbol}</div>
                                <div className="text-xs text-muted-foreground">{approval.tokenName}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="text-sm font-mono">
                                {approval.spender.substring(0, 6)}...{approval.spender.substring(approval.spender.length - 4)}
                              </span>
                              <Button variant="ghost" size="icon" className="ml-1 h-5 w-5" onClick={() => {
                                navigator.clipboard.writeText(approval.spender);
                                toast({
                                  title: "Address copied",
                                  description: "Contract address copied to clipboard"
                                });
                              }}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {approval.allowance === Number.POSITIVE_INFINITY ? 
                              "Unlimited" : 
                              approval.allowance.toString()
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              approval.riskLevel === 'high' ? 'destructive' : 
                              approval.riskLevel === 'medium' ? 'default' : 
                              'outline'
                            }>
                              {approval.riskLevel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {approval.lastUsed ? new Date(approval.lastUsed).toLocaleDateString() : 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                toast({
                                  title: "Revoke initiated",
                                  description: `Revoking approval for ${approval.tokenSymbol}`,
                                });
                              }}
                            >
                              Revoke
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center">
                  <Shield className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-1">No token approvals found</p>
                  <p className="text-xs text-muted-foreground">Token approvals allow smart contracts to spend your tokens</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <TransactionHistory 
            transactions={formattedTransactions} 
            isLoading={isDataLoading}
            walletAddress={address || ''}
          />
        </TabsContent>
      </Tabs>
      
      {/* Modals */}
      <SendModal 
        isOpen={openSendModal}
        onClose={() => setOpenSendModal(false)}
        token={selectedToken ? {
          symbol: selectedToken.symbol,
          name: selectedToken.name,
          balance: selectedToken.balance.toString(),
          price: selectedToken.price || 0,
          decimals: selectedToken.decimals || 18
        } : null}
      />
      <ReceiveModal 
        isOpen={openReceiveModal}
        onClose={() => setOpenReceiveModal(false)}
        token={selectedToken ? {
          symbol: selectedToken.symbol,
          name: selectedToken.name,
          address: selectedToken.address
        } : null}
        walletAddress={address || '0x0000000000000000000000000000000000000000'}
      />
    </div>
  );
}