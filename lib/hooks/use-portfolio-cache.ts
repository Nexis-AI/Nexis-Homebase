import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase-client';
import { getPortfolioHistory, type PortfolioHistoryData, type PortfolioHistoryItem, type TokenData } from '../portfolio-service';
import type { Firestore } from 'firebase/firestore';

// Define portfolio data types - use the types from portfolio-service
export type { PortfolioHistoryData, PortfolioHistoryItem, TokenData };

// Cache durations for different timeframes - import from portfolio-service
import { CACHE_DURATIONS } from '../portfolio-service';

interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Hook for efficiently loading and caching portfolio history data
 */
export function usePortfolioCache(address?: string, chainId = '0x1') {
  const [data, setData] = useState<Record<string, PortfolioHistoryData | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | null>>({});

  // Normalize address for consistency
  const normalizedAddress = useMemo(() => 
    address ? address.toLowerCase() : '', [address]);

  /**
   * Load data from cache sources - first local storage (fastest),
   * then Firestore (persistent), then API if needed
   */
  useEffect(() => {
    if (!normalizedAddress) return;

    // First try local storage (fastest)
    const loadFromLocalStorage = () => {
      try {
        const timeframes = Object.keys(CACHE_DURATIONS);
        
        // Check each timeframe in localStorage
        for (const timeframe of timeframes) {
          const localKey = `portfolio_${normalizedAddress}_${chainId}_${timeframe}`;
          const stored = localStorage.getItem(localKey);
          
          if (stored) {
            const { data: storedData, timestamp } = JSON.parse(stored) as CachedData<PortfolioHistoryData>;
            const maxAge = CACHE_DURATIONS[timeframe as keyof typeof CACHE_DURATIONS];
            
            // Check if data is still fresh
            if (Date.now() - timestamp < maxAge) {
              setData(prev => ({ ...prev, [timeframe]: storedData }));
              continue; // Skip API call if we have fresh data
            }
          }
          
          // If we reach here, we need to fetch data
          loadFromFirestore(timeframe);
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        // Fall back to Firestore
        loadFromFirestore();
      }
    };
    
    // Then try Firestore (persistent across devices)
    const loadFromFirestore = async (specificTimeframe?: string) => {
      if (!db) {
        console.error('Firebase not initialized');
        fetchFromAPI(specificTimeframe);
        return;
      }
      
      try {
        const timeframes = specificTimeframe 
          ? [specificTimeframe] 
          : Object.keys(CACHE_DURATIONS);
          
        for (const timeframe of timeframes) {
          setLoading(prev => ({ ...prev, [timeframe]: true }));
          
          // Get reference to the cached portfolio data
          const docRef = doc(db, 'users', normalizedAddress, 'cache', `portfolio_${chainId}_${timeframe}`);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const { data: cachedData, timestamp } = docSnap.data() as { 
              data: PortfolioHistoryData, 
              timestamp: Timestamp 
            };
            const maxAge = CACHE_DURATIONS[timeframe as keyof typeof CACHE_DURATIONS];
            
            // Check if data is still fresh
            if (Date.now() - timestamp.toMillis() < maxAge) {
              setData(prev => ({ ...prev, [timeframe]: cachedData }));
              setLoading(prev => ({ ...prev, [timeframe]: false }));
              
              // Update localStorage as well
              cacheToLocalStorage(normalizedAddress, chainId, timeframe, cachedData);
              continue; // Skip API call for this timeframe
            }
          }
          
          // If we reach here, we need fresh data from API
          fetchFromAPI(timeframe);
        }
      } catch (error) {
        console.error('Error loading from Firestore:', error);
        // Fall back to API calls
        fetchFromAPI(specificTimeframe);
      }
    };
    
    // Finally, fetch fresh data from API
    const fetchFromAPI = async (specificTimeframe?: string) => {
      try {
        const timeframes = specificTimeframe 
          ? [specificTimeframe] 
          : Object.keys(CACHE_DURATIONS);
          
        for (const timeframe of timeframes) {
          setLoading(prev => ({ ...prev, [timeframe]: true }));
          
          // Call the existing portfolio data function
          const result = await getPortfolioData(timeframe, 30);
          
          if (result) {
            // Format the result to match PortfolioHistoryData structure exactly
            const formattedResult: PortfolioHistoryData = {
              history: result.history || [],
              currentValue: result.currentValue || 0,
              tokens: result.tokens || []
            };
            
            setData(prev => ({ ...prev, [timeframe]: formattedResult }));
            
            // Cache in both localStorage and Firestore
            cacheToLocalStorage(normalizedAddress, chainId, timeframe, formattedResult);
            cacheToFirestore(normalizedAddress, chainId, timeframe, formattedResult);
          }
          
          setLoading(prev => ({ ...prev, [timeframe]: false }));
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
        setError(prev => ({ 
          ...prev, 
          [specificTimeframe || 'all']: 'Failed to fetch portfolio data' 
        }));
      } finally {
        if (specificTimeframe) {
          setLoading(prev => ({ ...prev, [specificTimeframe]: false }));
        } else {
          const timeframes = Object.keys(CACHE_DURATIONS);
          const loadingState = Object.fromEntries(
            timeframes.map(t => [t, false])
          ) as Record<string, boolean>;
          setLoading(loadingState);
        }
      }
    };
    
    // Start the cascade - localStorage → Firestore → API
    loadFromLocalStorage();
  }, [normalizedAddress, chainId]);

  // Helper to cache data in localStorage
  const cacheToLocalStorage = (
    address: string, 
    chainId: string, 
    timeframe: string, 
    data: PortfolioHistoryData
  ) => {
    try {
      const key = `portfolio_${address}_${chainId}_${timeframe}`;
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching to localStorage:', error);
    }
  };
  
  // Helper to cache data in Firestore
  const cacheToFirestore = async (
    address: string, 
    chainId: string, 
    timeframe: string, 
    data: PortfolioHistoryData
  ) => {
    if (!db) return;
    
    try {
      const firestoreRef = doc(db as Firestore, 'users', address, 'cache', `portfolio_${chainId}_${timeframe}`);
      await setDoc(firestoreRef, {
        data,
        timestamp: Timestamp.fromDate(new Date()),
        address,
        chainId,
        timeframe
      });
    } catch (error) {
      console.error('Error caching to Firestore:', error);
    }
  };

  /**
   * Get portfolio data with caching, batching, and optimizations
   */
  const getPortfolioData = useCallback(async (
    timeframe: string,
    days: number
  ): Promise<PortfolioHistoryData | null> => {
    if (!address) return null;
    
    setLoading(prev => ({ ...prev, [timeframe]: true }));
    setError(prev => ({ ...prev, [timeframe]: null }));
    
    try {
      // Use the new portfolio service
      const result = await getPortfolioHistory(address, chainId, days);
      
      if (result) {
        setData(prev => ({ ...prev, [timeframe]: result }));
        return result;
      }
      
      return null;
    } catch (err) {
      console.error(`Error fetching portfolio data for ${timeframe}:`, err);
      setError(prev => ({ ...prev, [timeframe]: 'Failed to load portfolio data' }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [timeframe]: false }));
    }
  }, [address, chainId]);

  // Clear cache for testing or when user manually refreshes
  const clearCache = useCallback((timeframe?: string) => {
    try {
      if (timeframe) {
        // Clear specific timeframe
        const localStorageKey = `portfolio_${normalizedAddress}_${chainId}_${timeframe}`;
        localStorage.removeItem(localStorageKey);
        setData(prev => {
          const newData = { ...prev };
          delete newData[timeframe];
          return newData;
        });
      } else {
        // Clear all timeframes
        for (const tf of Object.keys(CACHE_DURATIONS)) {
          const localStorageKey = `portfolio_${normalizedAddress}_${chainId}_${tf}`;
          localStorage.removeItem(localStorageKey);
        }
        setData({});
      }
    } catch (e) {
      console.error('Error clearing cache', e);
    }
  }, [normalizedAddress, chainId]);

  // Preload data for other timeframes in the background
  useEffect(() => {
    if (!normalizedAddress) return;
    
    // First load most important timeframe (likely what user sees first)
    getPortfolioData('30d', 30).then(() => {
      // Then load others in the background
      const loadBackground = async () => {
        // Load in sequence to be gentler on the APIs
        await getPortfolioData('24h', 1);
        await getPortfolioData('7d', 7);
        await getPortfolioData('all', 365);
      };
      
      loadBackground().catch(console.error);
    });
  }, [normalizedAddress, getPortfolioData]);

  // Update the formatPortfolioData function to handle the new TokenData structure
  const formatPortfolioData = (data: PortfolioHistoryData | null): PortfolioHistoryData | null => {
    if (!data) return null;
    
    return {
      ...data,
      history: data.history || [],
      currentValue: data.currentValue || 0,
      tokens: data.tokens || []
    };
  };

  return {
    data,
    loading,
    error,
    getPortfolioData,
    clearCache
  };
} 