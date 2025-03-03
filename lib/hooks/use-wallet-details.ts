import { useState, useCallback } from 'react';
import { useWeb3Auth } from '../web3auth';

// Define local cache durations
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface WalletDetails {
  address: string;
  balance: { balance: string } | null;
  active_chains: string[];
  nativeNetworth: number;
  networth: number;
  networthDataLabels: string[];
  networthDatasets: number[];
  walletAge: number;
  firstSeenDate: string;
  lastSeenDate: string;
  isWhale: boolean;
  earlyAdopter: boolean;
  multiChainer: boolean;
  speculator: boolean;
  isFresh: boolean;
  ens: string | null;
  unstoppable: string | null;
}

interface WalletCache {
  data: WalletDetails;
  timestamp: number;
}

/**
 * Hook for fetching and caching wallet details
 */
export function useFetchWalletDetails() {
  const { walletAddress, chainId } = useWeb3Auth();
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWalletDetails = useCallback(async (forceRefresh = false) => {
    if (!walletAddress) {
      setError(new Error('No wallet address available'));
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cacheKey = `wallet_details_${walletAddress.toLowerCase()}_${chainId}`;
      const cachedJson = localStorage.getItem(cacheKey);
      
      // Use cache if available and not expired, unless force refresh is requested
      if (!forceRefresh && cachedJson) {
        try {
          const cached = JSON.parse(cachedJson) as WalletCache;
          const now = Date.now();
          const cacheAge = now - cached.timestamp;
          
          if (cacheAge < CACHE_DURATION) { // Use 1 day cache duration
            setWalletDetails(cached.data);
            setLoading(false);
            console.log('Using cached wallet details');
            return cached.data;
          }
          
          console.log('Wallet details cache expired, fetching fresh data');
        } catch (e) {
          console.error('Error parsing cached wallet details', e);
          localStorage.removeItem(cacheKey);
        }
      }

      // Fetch fresh data
      const response = await fetch('/api/moralis/wallet-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          walletAddress: walletAddress,
          chainId: chainId 
        }),
      });

      if (!response.ok) {
        throw new Error(`Error fetching wallet details: ${response.status}`);
      }

      const data = await response.json();
      
      // Store in cache
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      setWalletDetails(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching wallet details';
      console.error(errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setLoading(false);
    }
  }, [walletAddress, chainId]);

  return {
    walletDetails,
    loading,
    error,
    fetchWalletDetails
  };
}

export default useFetchWalletDetails; 