import { useState, useEffect, useCallback } from 'react';
import { 
  getPortfolioValue, 
  getTokenPrices,
  type PortfolioResponse,
  type TokenPricesResponse
} from '../defillama-client';

interface UseDefiLlamaDataProps {
  walletAddresses: string[];
  tokenAddresses: string[];
  enabled?: boolean;
}

interface UseDefiLlamaDataReturn {
  portfolioData: PortfolioResponse | null;
  tokenPrices: TokenPricesResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching data from DefiLlama API
 * 
 * @param walletAddresses Array of wallet addresses with chain prefix (e.g., ["ethereum:0x123...", "polygon:0xabc..."])
 * @param tokenAddresses Array of token addresses with chain prefix (e.g., ["ethereum:0x123...", "polygon:0xabc..."])
 * @param enabled Whether to enable data fetching (default: true)
 * @returns Object containing portfolio data, token prices, loading state, error state, and refetch function
 */
export function useDefiLlamaData({
  walletAddresses = [],
  tokenAddresses = [],
  enabled = true
}: UseDefiLlamaDataProps): UseDefiLlamaDataReturn {
  const [portfolioData, setPortfolioData] = useState<PortfolioResponse | null>(null);
  const [tokenPrices, setTokenPrices] = useState<TokenPricesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Function to fetch data from DefiLlama API
  const fetchData = useCallback(async () => {
    if (!enabled || (walletAddresses.length === 0 && tokenAddresses.length === 0)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch portfolio data if wallet addresses are provided
      if (walletAddresses.length > 0) {
        const portfolioResponse = await getPortfolioValue(walletAddresses);
        setPortfolioData(portfolioResponse);
      }

      // Fetch token prices if token addresses are provided
      if (tokenAddresses.length > 0) {
        const pricesResponse = await getTokenPrices(tokenAddresses);
        setTokenPrices(pricesResponse);
      }
    } catch (err) {
      console.error('Error fetching data from DefiLlama:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch data from DefiLlama'));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, walletAddresses, tokenAddresses]);

  // Fetch data when the hook is mounted or when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Function to manually refetch data
  const refetch = async (): Promise<void> => {
    await fetchData();
  };

  return {
    portfolioData,
    tokenPrices,
    isLoading,
    error,
    refetch
  };
}

export default useDefiLlamaData; 