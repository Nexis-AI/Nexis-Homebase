"use client";

import { useState, useEffect, useCallback } from 'react';

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  image: string;
}

interface UseTokenPricesResult {
  prices: Record<string, TokenPrice>;
  loading: boolean;
  error: Error | null;
  refreshPrices: () => Promise<void>;
}

/**
 * Hook to fetch real-time cryptocurrency prices
 * @param symbols Array of token symbols to fetch prices for (e.g., ['btc', 'eth'])
 * @param refreshInterval Interval in milliseconds to refresh prices (default: 60000 = 1 minute)
 */
export function useTokenPrices(
  symbols: string[],
  refreshInterval = 60000
): UseTokenPricesResult {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Convert symbols to lowercase for consistency
  const normalizedSymbols = symbols.map(s => s.toLowerCase());

  const fetchPrices = useCallback(async () => {
    if (normalizedSymbols.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Use CoinGecko API to fetch price data
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${normalizedSymbols.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch price data: ${response.status}`);
      }

      const data: TokenPrice[] = await response.json();
      
      // Create a mapping of symbol to price data
      const priceMap: Record<string, TokenPrice> = {};
      for (const token of data) {
        priceMap[token.symbol.toLowerCase()] = token;
      }

      setPrices(priceMap);
      setError(null);
    } catch (err) {
      console.error('Error fetching token prices:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching prices'));
      // If we fail, we'll use the last cached prices if available
    } finally {
      setLoading(false);
    }
  }, [normalizedSymbols]);

  // Fetch prices on mount and whenever symbols change
  useEffect(() => {
    fetchPrices();
    
    // Set up periodic refreshing if interval is provided
    if (refreshInterval > 0) {
      const interval = setInterval(fetchPrices, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPrices, refreshInterval]);

  return {
    prices,
    loading,
    error,
    refreshPrices: fetchPrices,
  };
}

// Fallback function to get price data when API fails or for tokens not listed
export function getTokenPriceFallback(symbol: string): Partial<TokenPrice> {
  const fallbackData: Record<string, Partial<TokenPrice>> = {
    eth: {
      current_price: 3500,
      price_change_percentage_24h: 2.5,
      market_cap: 420000000000,
      total_volume: 15200000000,
    },
    usdc: {
      current_price: 1,
      price_change_percentage_24h: 0.1,
      market_cap: 45000000000,
      total_volume: 2800000000,
    },
    usdt: {
      current_price: 1,
      price_change_percentage_24h: 0,
      market_cap: 90000000000,
      total_volume: 50000000000,
    },
    wbtc: {
      current_price: 65000,
      price_change_percentage_24h: 3.2,
      market_cap: 850000000000,
      total_volume: 25500000000,
    },
  };

  return fallbackData[symbol.toLowerCase()] || {
    current_price: 1,
    price_change_percentage_24h: 0,
    market_cap: 0,
    total_volume: 0,
  };
} 