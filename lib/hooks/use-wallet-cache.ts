import { useLocalStorage } from './use-local-storage';
import { useCallback } from 'react';

// Define wallet connection method types
export type WalletConnectionMethod = 
  | 'web3auth'
  | 'walletconnect'
  | 'injected'
  | 'coinbase'
  | 'other';

// Structure for storing wallet connection info
export interface CachedWalletInfo {
  address: string;
  method: WalletConnectionMethod;
  chainId: number;
  lastConnected: number; // timestamp
  ensName?: string;
  // Metrics for analyzing connection performance
  connectionTimes?: number[]; // array of connection times in ms
  avgConnectionTime?: number | null; // calculated average - make this nullable
  connectionCount: number;
  lastUsed: number; // timestamp
  lastConnectionTime: number | null; // Add this field
}

// Type for the cached wallets storage
interface WalletCache {
  recentWallets: CachedWalletInfo[];
  lastConnectedWallet?: string; // address of last wallet
  preferredConnectionMethod?: WalletConnectionMethod;
}

// Default cache structure
const defaultCache: WalletCache = {
  recentWallets: [],
  lastConnectedWallet: undefined,
  preferredConnectionMethod: undefined
};

// Maximum number of recent wallets to store
const MAX_RECENT_WALLETS = 5;

/**
 * Hook for caching wallet connections to improve reconnection speed
 * Stores recent wallets, connection methods, and performance metrics
 */
export function useWalletCache() {
  const [cache, setCache] = useLocalStorage<WalletCache>(
    'nexis-wallet-cache', 
    defaultCache
  );

  /**
   * Add or update a wallet in the cache
   */
  const cacheWallet = useCallback((walletInfo: Omit<CachedWalletInfo, 'connectionCount' | 'lastUsed' | 'avgConnectionTime' | 'lastConnectionTime'>) => {
    setCache(prevCache => {
      // Check if wallet already exists in cache
      const existingWalletIndex = prevCache.recentWallets.findIndex(
        w => w.address.toLowerCase() === walletInfo.address.toLowerCase()
      );
      
      const now = Date.now();
      let updatedRecentWallets = [...prevCache.recentWallets];
      
      if (existingWalletIndex > -1) {
        // Update existing wallet entry
        const existingWallet = updatedRecentWallets[existingWalletIndex];
        const connectionTimes = existingWallet.connectionTimes || [];
        
        // If we have a connection time to add (the difference between now and lastConnected)
        let updatedConnectionTimes = connectionTimes;
        if (existingWallet.lastConnected) {
          // Only add reasonable connection times (1-10 seconds)
          const timeDiff = now - existingWallet.lastConnected;
          if (timeDiff >= 1000 && timeDiff <= 10000) {
            updatedConnectionTimes = [...connectionTimes, timeDiff];
          }
        }
        
        // Calculate average connection time
        const avgTime = updatedConnectionTimes.length 
          ? updatedConnectionTimes.reduce((sum, time) => sum + time, 0) / updatedConnectionTimes.length 
          : undefined;
          
        updatedRecentWallets[existingWalletIndex] = {
          ...existingWallet,
          ...walletInfo,
          lastConnected: now,
          connectionTimes: updatedConnectionTimes,
          avgConnectionTime: avgTime,
          connectionCount: existingWallet.connectionCount + 1,
          lastUsed: now,
          lastConnectionTime: null, // Will be set by the timer
        };
      } else {
        // Add new wallet to the front of the array
        updatedRecentWallets = [
          {
            ...walletInfo,
            lastConnected: now,
            connectionTimes: [], // Initialize empty connection times array
            connectionCount: 1,
            lastUsed: now,
            avgConnectionTime: null,
            lastConnectionTime: null, // Will be set by the timer
          },
          ...updatedRecentWallets
        ];
        
        // Limit to MAX_RECENT_WALLETS
        if (updatedRecentWallets.length > MAX_RECENT_WALLETS) {
          updatedRecentWallets = updatedRecentWallets.slice(0, MAX_RECENT_WALLETS);
        }
      }
      
      return {
        ...prevCache,
        recentWallets: updatedRecentWallets,
        lastConnectedWallet: walletInfo.address,
        preferredConnectionMethod: walletInfo.method
      };
    });
  }, [setCache]);
  
  /**
   * Remove a wallet from the cache
   */
  const removeWallet = useCallback((address: string) => {
    setCache(prevCache => {
      const updatedRecentWallets = prevCache.recentWallets.filter(
        w => w.address.toLowerCase() !== address.toLowerCase()
      );
      
      // Update last connected wallet if needed
      let lastConnectedWallet = prevCache.lastConnectedWallet;
      if (lastConnectedWallet?.toLowerCase() === address.toLowerCase()) {
        lastConnectedWallet = updatedRecentWallets.length > 0 
          ? updatedRecentWallets[0].address 
          : undefined;
      }
      
      return {
        ...prevCache,
        recentWallets: updatedRecentWallets,
        lastConnectedWallet
      };
    });
  }, [setCache]);
  
  /**
   * Clear the entire wallet cache
   */
  const clearWallets = useCallback(() => {
    setCache(defaultCache);
  }, [setCache]);

  /**
   * Record connection start time for performance tracking
   */
  const startConnectionTimer = useCallback((address: string) => {
    const startTime = Date.now();
    return () => {
      const connectionTime = Date.now() - startTime;
      setCache(prevCache => {
        const existingWalletIndex = prevCache.recentWallets.findIndex(
          w => w.address.toLowerCase() === address.toLowerCase()
        );
        
        if (existingWalletIndex > -1) {
          const updatedRecentWallets = [...prevCache.recentWallets];
          const existingWallet = updatedRecentWallets[existingWalletIndex];
          const connectionTimes = existingWallet.connectionTimes || [];
          
          // Calculate new average connection time
          const newAvgTime = existingWallet.avgConnectionTime 
            ? (existingWallet.avgConnectionTime * (existingWallet.connectionCount - 1) + connectionTime) / existingWallet.connectionCount
            : connectionTime;
          
          updatedRecentWallets[existingWalletIndex] = {
            ...existingWallet,
            connectionTimes: [...connectionTimes, connectionTime],
            avgConnectionTime: newAvgTime,
            lastConnectionTime: connectionTime, // Set the last connection time
          };
          
          return {
            ...prevCache,
            recentWallets: updatedRecentWallets
          };
        }
        
        return prevCache;
      });
      
      return connectionTime;
    };
  }, [setCache]);

  return {
    recentWallets: cache.recentWallets,
    lastConnectedWallet: cache.lastConnectedWallet,
    preferredConnectionMethod: cache.preferredConnectionMethod,
    cacheWallet,
    removeWallet,
    clearCache: clearWallets,
    clearWallets,
    startConnectionTimer,
  };
} 