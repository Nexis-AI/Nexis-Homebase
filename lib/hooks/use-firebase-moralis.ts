"use client";

import { useState, useEffect, useCallback } from 'react';
import { useMoralisData } from './use-moralis-data';
import { 
  doc, 
  getDoc, 
  onSnapshot, 
  Timestamp, 
  Unsubscribe,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase-client';
import { syncWalletDataToFirebase, updateWalletDataCollection } from '../firebase-sync';
import type { 
  MoralisToken, 
  MoralisNFT, 
  MoralisTransaction, 
  MoralisApproval, 
  PortfolioHistoryItem 
} from './use-moralis-data';
import { withMoralis } from '@/lib/moralis-client';
import Moralis from 'moralis';
import { useDebouncedCallback } from 'use-debounce';

export interface FirebaseMoralisOptions {
  // Listen for real-time updates from Firebase
  listenForUpdates?: boolean;
  // Cache data in Firebase for persistence
  cacheInFirebase?: boolean;
  // Enable polling for fresh data
  polling?: boolean;
  // Polling interval in milliseconds
  pollingInterval?: number;
  // Include NFTs (can be resource-intensive)
  includeNFTs?: boolean;
  // Include transaction history
  includeHistory?: boolean;
  // Cache time-to-live in milliseconds
  cacheTTL?: number;
}

interface FirebaseMoralisData {
  tokenBalances: MoralisToken[];
  nfts: MoralisNFT[];
  transactions: MoralisTransaction[];
  tokenApprovals: MoralisApproval[];
  portfolioHistory: PortfolioHistoryItem[];
  lastUpdated?: Date;
}

const DEFAULT_OPTIONS: FirebaseMoralisOptions = {
  listenForUpdates: true,
  cacheInFirebase: true,
  polling: false,
  pollingInterval: 60 * 1000, // 1 minute
  includeNFTs: false,
  includeHistory: true,
  cacheTTL: 30 * 60 * 1000, // 30 minutes
};

// Types for wallet data
interface WalletData {
  address: string;
  chain: string;
  lastUpdated?: number | string;
  source?: 'cache' | 'api';
  tokenBalances?: any[];
  nfts?: any[];
  transactions?: any[];
  tokenApprovals?: any[];
  portfolioHistory?: any[];
}

interface UseFirebaseMoralisOptions {
  includeNFTs?: boolean;
  includeHistory?: boolean;
  listenForUpdates?: boolean;
  cacheTime?: number; // Time in ms before cache is considered stale
}

/**
 * Custom hook that integrates Moralis data with Firebase
 * - Loads cached data from Firebase if available
 * - Fetches fresh data from Moralis
 * - Updates Firebase cache with fresh data
 * - Optionally listens for real-time updates
 * 
 * @param address Wallet address
 * @param chainId Blockchain chain ID
 * @param options Configuration options
 */
export function useFirebaseMoralis(
  address?: string,
  chainId: string = '0x1',
  options?: FirebaseMoralisOptions
) {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // State for cached data
  const [cachedData, setCachedData] = useState<FirebaseMoralisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Get fresh data from Moralis
  const moralisData = useMoralisData(address, chainId, {
    includeNFTs: opts.includeNFTs,
    includeHistory: opts.includeHistory,
  });

  // Function to manually refresh data
  const refetch = useCallback(async () => {
    if (!address) return null;

    setLoading(true);
    try {
      const result = await syncWalletDataToFirebase(address, chainId, {
        force: true,
        includeNFTs: opts.includeNFTs,
        includeHistory: opts.includeHistory,
        ttl: opts.cacheTTL,
      });
      setCachedData(result.data as unknown as FirebaseMoralisData);
      return result.data;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [address, chainId, opts.includeNFTs, opts.includeHistory, opts.cacheTTL]);

  // Function to update a specific collection
  const updateCollection = useCallback(
    async (collection: 'tokenBalances' | 'nfts' | 'transactions' | 'tokenApprovals' | 'portfolioHistory') => {
      if (!address) return null;
      try {
        const result = await updateWalletDataCollection(address, chainId, collection, true);
        setCachedData((prev) => prev ? { ...prev, [collection]: result.data } : null);
        return result.data;
      } catch (err) {
        console.error(`Error updating ${collection}:`, err);
        return null;
      }
    },
    [address, chainId]
  );

  // Effect for polling
  useEffect(() => {
    if (!opts.polling || !address) return;

    const intervalId = setInterval(() => {
      refetch();
    }, opts.pollingInterval);

    return () => clearInterval(intervalId);
  }, [opts.polling, opts.pollingInterval, address, refetch]);

  // Effect to load cached data from Firebase
  useEffect(() => {
    if (!address || !opts.cacheInFirebase) {
      setLoading(false);
      return;
    }

    const loadCachedData = async () => {
      setLoading(true);
      try {
        const normalizedAddress = address.toLowerCase();
        const userDocRef = doc(db, 'users', normalizedAddress);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCachedData(userData as FirebaseMoralisData);
        }
      } catch (err) {
        console.error('Error loading cached data:', err);
        // Don't set error here, just fail silently for cache
      } finally {
        setLoading(false);
      }
    };

    loadCachedData();
  }, [address, opts.cacheInFirebase]);

  // Effect to listen for updates from Firebase
  useEffect(() => {
    if (!address || !opts.listenForUpdates) return;

    const normalizedAddress = address.toLowerCase();
    const userDocRef = doc(db, 'users', normalizedAddress);
    
    const unsubscribe: Unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setCachedData(snapshot.data() as FirebaseMoralisData);
        }
      },
      (err) => {
        console.error('Error listening to Firebase updates:', err);
        // Don't set error on UI for listener issues
      }
    );

    return () => unsubscribe();
  }, [address, opts.listenForUpdates]);

  // Effect to update Firebase when fresh Moralis data arrives
  useEffect(() => {
    if (
      !address ||
      !opts.cacheInFirebase ||
      moralisData.loading ||
      !moralisData.data
    ) {
      return;
    }

    // Only update Firebase if we have valid data and it's not loading
    const updateFirebase = async () => {
      try {
        await syncWalletDataToFirebase(address, chainId, {
          force: false, // Don't force it to refresh from Moralis again
          includeNFTs: opts.includeNFTs,
          includeHistory: opts.includeHistory,
          ttl: opts.cacheTTL,
        });
      } catch (err) {
        console.error('Error updating Firebase with fresh Moralis data:', err);
        // Don't set UI error for background sync issues
      }
    };

    updateFirebase();
  }, [
    address,
    chainId,
    opts.cacheInFirebase,
    opts.includeNFTs,
    opts.includeHistory,
    opts.cacheTTL,
    moralisData.data,
    moralisData.loading,
  ]);

  // Combine fresh and cached data, prioritizing fresh data
  const combinedData = {
    // If we have fresh data from Moralis, use it, otherwise fall back to cached
    tokenBalances: moralisData.data?.tokenBalances || cachedData?.tokenBalances || [],
    nfts: moralisData.data?.nfts || cachedData?.nfts || [],
    transactions: moralisData.data?.transactions || cachedData?.transactions || [],
    tokenApprovals: moralisData.data?.tokenApprovals || cachedData?.tokenApprovals || [],
    portfolioHistory: moralisData.data?.portfolioHistory || cachedData?.portfolioHistory || [],
  };

  return {
    // Combined data (fresh Moralis data takes precedence over cached)
    data: combinedData,
    // Cached data from Firebase
    cachedData,
    // Fresh data from Moralis
    moralisData: moralisData.data,
    // Loading state (true if either source is loading)
    loading: loading || moralisData.loading, 
    // Error state (from either source)
    error: error || moralisData.error,
    // Function to manually refresh data
    refetch,
    // Function to update a specific collection
    updateCollection,
  };
} 