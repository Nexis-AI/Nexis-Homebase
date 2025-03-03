"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';

// Define token price schema for type safety
const tokenPriceSchema = z.object({
  tokenAddress: z.string().optional(),
  usdPrice: z.number().optional(),
  nativePrice: z.object({
    value: z.string(),
    decimals: z.number(),
    name: z.string(),
    symbol: z.string(),
    address: z.string()
  }).optional(),
  exchangeAddress: z.string().optional(),
  exchangeName: z.string().optional(),
  priceChange: z.object({
    '24h': z.number().optional(),
    '7d': z.number().optional(),
    '30d': z.number().optional()
  }).optional()
});

export type TokenPrice = z.infer<typeof tokenPriceSchema>;

export interface TokenPriceState {
  prices: Record<string, TokenPrice | null>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => Promise<void>;
  getUsdPrice: (address: string) => number | undefined;
  getUsdValue: (address: string, amount: string | number, decimals?: number) => number | undefined;
  getPriceChange: (address: string, period: '24h' | '7d' | '30d') => number | undefined;
}

// Constants
const MIN_REFRESH_INTERVAL = 30000; // 30 seconds between refreshes
const DEBOUNCE_DELAY = 500; // 500ms debounce for rapid changes
const DEFAULT_REFRESH_INTERVAL = 60000; // 1 minute

/**
 * Hook to fetch and track token prices
 */
export const useTokenPrices = (
  tokenAddresses: string[] = [],
  chain = '0x1',
  refreshInterval = DEFAULT_REFRESH_INTERVAL
): TokenPriceState => {
  const [prices, setPrices] = useState<Record<string, TokenPrice | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  // Use refs to track the last refresh time and pending requests
  const lastRefreshTimeRef = useRef<number>(0);
  const pendingRequestRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const addressesRef = useRef<string[]>(tokenAddresses);
  
  // Update the ref when addresses change
  useEffect(() => {
    addressesRef.current = tokenAddresses;
  }, [tokenAddresses]);

  // Normalize token addresses: lowercase and filter duplicates and empty values
  const getNormalizedAddresses = useCallback(() => {
    const normalizedAddresses = addressesRef.current
      .filter(Boolean)
      .map(addr => addr.toLowerCase());
    
    // Remove duplicates
    return [...new Set(normalizedAddresses)];
  }, []);

  /**
   * Fetch token prices for all tokens in the list
   */
  const refreshPrices = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    
    // Skip if already loading or refreshed too recently
    if (pendingRequestRef.current || timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
      return;
    }
    
    const normalizedAddresses = getNormalizedAddresses();
    
    if (normalizedAddresses.length === 0) {
      return;
    }
    
    try {
      pendingRequestRef.current = true;
      setIsLoading(true);
      setError(null);
      
      // Create the URL with the batch of tokens
      const url = `/api/moralis/token-prices?tokens=${normalizedAddresses.join(',')}&chain=${chain}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch token prices');
      }
      
      // Update the prices state with new data
      setPrices(prev => ({
        ...prev,
        ...data.prices
      }));
      
      setLastUpdated(now);
      lastRefreshTimeRef.current = now;
      
      // Log stats about the fetch
      console.log(`[Token Prices] Refreshed ${Object.keys(data.prices).length} prices. Meta:`, data.meta);
    } catch (err) {
      console.error('Error fetching token prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch token prices');
    } finally {
      setIsLoading(false);
      pendingRequestRef.current = false;
    }
  }, [chain, getNormalizedAddresses]);

  // Debounced refresh function for rapid address changes
  const debouncedRefresh = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      refreshPrices();
      debounceTimerRef.current = null;
    }, DEBOUNCE_DELAY);
  }, [refreshPrices]);

  // Effect to refresh prices when tokenAddresses change
  useEffect(() => {
    // Only trigger a refresh if we have addresses to fetch
    if (tokenAddresses.length > 0) {
      debouncedRefresh();
    }
  }, [tokenAddresses, debouncedRefresh]);

  // Set up interval for periodic refreshes
  useEffect(() => {
    // Initial fetch
    if (tokenAddresses.length > 0 && !lastUpdated) {
      refreshPrices();
    }
    
    // Set up interval for refreshes
    const intervalId = setInterval(() => {
      if (tokenAddresses.length > 0) {
        refreshPrices();
      }
    }, refreshInterval);
    
    return () => {
      clearInterval(intervalId);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [refreshInterval, tokenAddresses, lastUpdated, refreshPrices]);

  // Helper functions
  const getUsdPrice = useCallback((address: string): number | undefined => {
    const normalizedAddress = address.toLowerCase();
    return prices[normalizedAddress]?.usdPrice;
  }, [prices]);

  const getUsdValue = useCallback((
    address: string,
    amount: string | number,
    decimals = 18
  ): number | undefined => {
    const usdPrice = getUsdPrice(address);
    if (usdPrice === undefined) return undefined;
    
    const amountNumber = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
    return usdPrice * (amountNumber / 10 ** decimals);
  }, [getUsdPrice]);

  const getPriceChange = useCallback((
    address: string,
    period: '24h' | '7d' | '30d'
  ): number | undefined => {
    const normalizedAddress = address.toLowerCase();
    return prices[normalizedAddress]?.priceChange?.[period];
  }, [prices]);

  return {
    prices,
    isLoading,
    error,
    lastUpdated,
    refresh: refreshPrices,
    getUsdPrice,
    getUsdValue,
    getPriceChange
  };
}; 