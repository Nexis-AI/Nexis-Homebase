import type { BrowserProvider } from "ethers";
import type { Signer } from "ethers";
import type { SafeEventEmitterProvider } from '@web3auth/base';
import { safeDisconnectWalletConnect } from './wallet-disconnect-patch';
import { wagmiConfig } from './wallet-config';
import { createWeb3Modal } from '@web3modal/wagmi/react';

// ConnectionMethod type for tracking connection source
export type ConnectionMethod = 'web3auth' | 'walletconnect' | 'wagmi' | 'metamask' | 'injected' | 'unknown';

// Connection metrics for analytics
export interface ConnectionMetrics {
  connectionAttempts: number;
  successfulConnections: number;
  failedConnections: number;
  lastConnectionTime?: number; // in milliseconds
  averageConnectionTime?: number; // in milliseconds 
  lastError?: string;
}

// Wallet info for recent wallets
export interface WalletInfo {
  address: string;
  method: ConnectionMethod;
  lastConnected: number; // timestamp
  connectionTimes: number[]; // array of connection durations in ms
  avgConnectionTime?: number;
}

// Keep metrics in memory
const connectionMetrics: ConnectionMetrics = {
  connectionAttempts: 0,
  successfulConnections: 0,
  failedConnections: 0
};

// Recent wallet connections (max 5)
const recentWallets: WalletInfo[] = [];

/**
 * Initialize Web3Modal for WalletConnect integration
 */
export const initializeWeb3Modal = () => {
  if (typeof window === "undefined") return;

  try {
    const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 
                     process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
    
    if (!projectId) {
      console.warn('No WalletConnect project ID found in environment variables');
      return;
    }

    createWeb3Modal({
      wagmiConfig,
      projectId,
      enableAnalytics: false,
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#3694FF', // Nexis blue color
        '--w3m-border-radius-master': '8px',
      },
    });
    
    console.log("Web3Modal initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Web3Modal:", error);
  }
};

/**
 * Record a successful wallet connection
 */
export const recordSuccessfulConnection = (
  address: string, 
  method: ConnectionMethod, 
  connectionTime: number,
  provider?: SafeEventEmitterProvider | null,
  ethersProvider?: BrowserProvider | null,
  ethersSigner?: Signer | null
): {
  address: string;
  method: ConnectionMethod;
  provider?: SafeEventEmitterProvider | null;
  ethersProvider?: BrowserProvider | null;
  ethersSigner?: Signer | null;
} => {
  // Record success
  connectionMetrics.successfulConnections++;
  connectionMetrics.lastConnectionTime = connectionTime;
  
  // Update average connection time
  if (connectionMetrics.averageConnectionTime) {
    connectionMetrics.averageConnectionTime = 
      (connectionMetrics.averageConnectionTime + connectionTime) / 2;
  } else {
    connectionMetrics.averageConnectionTime = connectionTime;
  }
  
  // Update recent wallets
  updateRecentWallets(address, method, connectionTime);
  
  return {
    address,
    method,
    provider,
    ethersProvider,
    ethersSigner
  };
};

/**
 * Record a failed wallet connection
 */
export const recordFailedConnection = (error: unknown): void => {
  // Record failure
  connectionMetrics.failedConnections++;
  connectionMetrics.lastError = error instanceof Error ? error.message : String(error);
  
  console.error("Error connecting wallet:", error);
};

/**
 * Format wallet address for display
 */
export const formatAddress = (address: string | null | undefined): string => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Get connection metrics
 */
export const getConnectionMetrics = (): ConnectionMetrics => {
  return { ...connectionMetrics };
};

/**
 * Get recent wallets
 */
export const getRecentWallets = (): WalletInfo[] => {
  return [...recentWallets];
};

/**
 * Helper function to update recent wallets list
 */
const updateRecentWallets = (address: string, method: ConnectionMethod, connectionTime: number) => {
  // Normalize address
  const normalizedAddress = address.toLowerCase();
  
  // Find existing wallet entry
  const existingIndex = recentWallets.findIndex(w => w.address.toLowerCase() === normalizedAddress);
  
  if (existingIndex >= 0) {
    // Update existing entry
    const existing = recentWallets[existingIndex];
    
    // Update connection times (max 10 entries)
    const connectionTimes = [...existing.connectionTimes, connectionTime].slice(-10);
    
    // Calculate average connection time
    const avgConnectionTime = connectionTimes.reduce((sum, time) => sum + time, 0) / connectionTimes.length;
    
    // Update wallet info
    recentWallets[existingIndex] = {
      ...existing,
      method, // Update method in case it changed
      lastConnected: Date.now(),
      connectionTimes,
      avgConnectionTime
    };
    
    // Move to front of the list
    recentWallets.splice(0, 0, recentWallets.splice(existingIndex, 1)[0]);
  } else {
    // Add new wallet (limited to 5 recent wallets)
    recentWallets.unshift({
      address,
      method,
      lastConnected: Date.now(),
      connectionTimes: [connectionTime],
      avgConnectionTime: connectionTime
    });
    
    // Keep only 5 most recent
    if (recentWallets.length > 5) {
      recentWallets.pop();
    }
  }
  
  // Save to localStorage if available
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('recentWallets', JSON.stringify(recentWallets));
    } catch (e) {
      // Ignore storage errors
    }
  }
};

/**
 * Load recent wallets from localStorage on startup
 */
export const loadSavedWallets = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const saved = localStorage.getItem('recentWallets');
    if (saved) {
      const parsed = JSON.parse(saved) as WalletInfo[];
      // Clear array and push all items
      recentWallets.length = 0;
      recentWallets.push(...parsed.slice(0, 5));
    }
  } catch (e) {
    // Ignore storage errors
  }
};

/**
 * Clear any pending connection requests
 * This helps prevent the "Connection can be declined if a previous request is still active" error
 */
export const clearPendingConnections = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear any WalletConnect session data in localStorage
    const wcSessionKey = 'walletconnect';
    const hasWCSession = localStorage.getItem(wcSessionKey);
    
    if (hasWCSession) {
      // Check if the session is stale (no connected wallet)
      const wcSession = JSON.parse(hasWCSession);
      if (!wcSession.connected) {
        localStorage.removeItem(wcSessionKey);
        console.log('Cleared stale WalletConnect session');
      }
    }
    
    // Clear other potential WalletConnect related items
    localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
    
    // If Web3Modal has a session that might be interfering, clear it
    const w3mSessionKey = 'wagmi.store';
    const w3mSession = localStorage.getItem(w3mSessionKey);
    
    if (w3mSession) {
      try {
        const session = JSON.parse(w3mSession);
        // Only clear if there's no active account
        if (!session.state?.account) {
          localStorage.removeItem(w3mSessionKey);
          console.log('Cleared inactive Web3Modal session');
        }
      } catch (e) {
        // If we can't parse it, better to clear it
        localStorage.removeItem(w3mSessionKey);
      }
    }
    
    // Clear Web3Auth connection data if present and not active
    const web3AuthKey = 'openlogin_store';
    const web3AuthSession = localStorage.getItem(web3AuthKey);
    
    if (web3AuthSession) {
      try {
        const session = JSON.parse(web3AuthSession);
        // If session is not actively connected
        if (!session?.sessionId) {
          localStorage.removeItem(web3AuthKey);
          console.log('Cleared inactive Web3Auth session');
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Force clear any stale modal state
    const dialogElements = document.querySelectorAll('[role="dialog"]');
    for (const el of dialogElements) {
      if (el.getAttribute('aria-label')?.includes('wallet') || 
          el.getAttribute('aria-label')?.includes('connect')) {
        // This is likely a wallet connection modal that wasn't properly closed
        el.remove();
        console.log('Removed stale wallet connection modal');
      }
    }
    
  } catch (e) {
    console.warn('Error clearing pending connections:', e);
  }
}; 