import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import {
  getPortfolioData,
  getPortfolioHistoricalData,
  getTransactionHistory,
  getNFTsWithCache
} from '../portfolio-data-service';
import { useAccount } from 'wagmi';

// Define supported chains
const SUPPORTED_CHAINS = ['eth', 'polygon', 'bsc', 'avalanche', 'arbitrum'];

// Define timeframe options for historical data
export const TIMEFRAMES = ['24h', '7d', '30d', '90d', '1y', 'all'];

export function useEnhancedPortfolio(initialChain = 'eth', initialTimeframe = '30d') {
  const { address, isConnected } = useAccount();
  const [selectedChain, setSelectedChain] = useState<string>(initialChain);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(initialTimeframe);
  const [isMultichain, setIsMultichain] = useState<boolean>(false);
  const [allChainsData, setAllChainsData] = useState<Record<string, any>>({});

  // Validate the address is connected
  const validAddress = isConnected && address ? address : null;

  // Portfolio data fetcher
  const {
    data: portfolioData,
    error: portfolioError,
    isLoading: isPortfolioLoading,
    mutate: refreshPortfolio
  } = useSWR(
    validAddress ? ['portfolio', validAddress, selectedChain] : null,
    ([_, address, chain]) => getPortfolioData(address, chain),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Refresh every minute
      dedupingInterval: 30000 // Dedupe calls within 30 seconds
    }
  );

  // Historical data fetcher with timeframe selection
  const {
    data: historicalData,
    error: historicalError,
    isLoading: isHistoricalLoading,
    mutate: refreshHistorical
  } = useSWR(
    validAddress ? ['portfolioHistory', validAddress, selectedTimeframe] : null,
    ([_, address, timeframe]) => getPortfolioHistoricalData(address, timeframe),
    {
      revalidateOnFocus: false,
      refreshInterval: 300000, // Refresh every 5 minutes
      dedupingInterval: 60000 // Dedupe calls within 1 minute
    }
  );

  // Transactions fetcher
  const {
    data: transactions,
    error: transactionsError,
    isLoading: isTransactionsLoading,
    mutate: refreshTransactions
  } = useSWR(
    validAddress ? ['transactions', validAddress, selectedChain] : null,
    ([_, address, chain]) => getTransactionHistory(address, chain),
    {
      revalidateOnFocus: false,
      refreshInterval: 120000, // Refresh every 2 minutes
      dedupingInterval: 60000 // Dedupe calls within 1 minute
    }
  );

  // NFTs fetcher
  const {
    data: nfts,
    error: nftsError,
    isLoading: isNftsLoading,
    mutate: refreshNfts
  } = useSWR(
    validAddress ? ['nfts', validAddress, selectedChain] : null,
    ([_, address, chain]) => getNFTsWithCache(address, chain),
    {
      revalidateOnFocus: false,
      refreshInterval: 600000, // Refresh every 10 minutes
      dedupingInterval: 300000 // Dedupe calls within 5 minutes
    }
  );

  // Function to change the selected chain
  const changeChain = useCallback((chain: string) => {
    if (SUPPORTED_CHAINS.includes(chain)) {
      setSelectedChain(chain);
    } else {
      console.warn(`Chain ${chain} is not supported. Using 'eth' instead.`);
      setSelectedChain('eth');
    }
  }, []);

  // Function to change the timeframe for historical data
  const changeTimeframe = useCallback((timeframe: string) => {
    if (TIMEFRAMES.includes(timeframe)) {
      setSelectedTimeframe(timeframe);
    } else {
      console.warn(`Timeframe ${timeframe} is not supported. Using '30d' instead.`);
      setSelectedTimeframe('30d');
    }
  }, []);

  // Toggle multi-chain view
  const toggleMultichain = useCallback(async () => {
    setIsMultichain(prev => !prev);
  }, []);

  // Load all chains data when multichain is enabled
  useEffect(() => {
    if (!isMultichain || !validAddress) return;

    const fetchAllChainsData = async () => {
      const promises = SUPPORTED_CHAINS.map(async (chain) => {
        try {
          const data = await getPortfolioData(validAddress, chain);
          return { chain, data };
        } catch (error) {
          console.error(`Error fetching data for chain ${chain}:`, error);
          return { chain, data: null };
        }
      });

      const results = await Promise.all(promises);
      const chainsData = results.reduce((acc, { chain, data }) => {
        if (data) {
          acc[chain] = data;
        }
        return acc;
      }, {} as Record<string, any>);

      setAllChainsData(chainsData);
    };

    fetchAllChainsData();
  }, [isMultichain, validAddress]);

  // Manual refresh function for all data
  const refreshAll = useCallback(async () => {
    if (!validAddress) return;

    // Create an array of promises to refresh all data
    const refreshPromises = [
      refreshPortfolio(),
      refreshHistorical(),
      refreshTransactions(),
      refreshNfts()
    ];

    // If multichain is enabled, refresh data for all chains
    if (isMultichain) {
      const multiChainPromises = SUPPORTED_CHAINS.map(chain => 
        getPortfolioData(validAddress, chain)
          .then(data => ({ chain, data }))
          .catch(error => {
            console.error(`Error refreshing data for chain ${chain}:`, error);
            return { chain, data: null };
          })
      );

      const results = await Promise.all(multiChainPromises);
      const chainsData = results.reduce((acc, { chain, data }) => {
        if (data) {
          acc[chain] = data;
        }
        return acc;
      }, {} as Record<string, any>);

      setAllChainsData(chainsData);
    }

    // Wait for all refreshes to complete
    await Promise.all(refreshPromises);
  }, [
    validAddress,
    refreshPortfolio,
    refreshHistorical,
    refreshTransactions,
    refreshNfts,
    isMultichain
  ]);

  return {
    // Data
    portfolioData,
    historicalData,
    transactions,
    nfts,
    allChainsData,
    
    // State
    selectedChain,
    selectedTimeframe,
    isMultichain,
    
    // Loading states
    isPortfolioLoading,
    isHistoricalLoading,
    isTransactionsLoading,
    isNftsLoading,
    
    // Errors
    portfolioError,
    historicalError,
    transactionsError,
    nftsError,
    
    // Actions
    changeChain,
    changeTimeframe,
    toggleMultichain,
    refreshAll,
    
    // Additional
    address: validAddress,
    isConnected,
    supportedChains: SUPPORTED_CHAINS
  };
} 