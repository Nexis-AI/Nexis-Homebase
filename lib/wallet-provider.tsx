"use client";

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig, projectId, featuredWalletIds } from './wallet-config';
import { useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client for React Query with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Reduced retry for faster connection perception
      retryDelay: 500, // 0.5s delay between retries - faster recovery
      staleTime: 30 * 1000, // 30s stale time
      gcTime: 5 * 60 * 1000, // 5 minute garbage collection time (formerly cacheTime)
      networkMode: 'online', // Only make requests when online
      refetchOnWindowFocus: false, // Don't refetch on focus to reduce requests
    },
  },
});

// Initialize Web3Modal with lazy loading
let web3ModalInitialized = false;

const initializeWeb3Modal = () => {
  if (typeof window === 'undefined' || !projectId || web3ModalInitialized) return;
  
  try {
    createWeb3Modal({
      wagmiConfig,
      projectId,
      enableAnalytics: false,
      themeMode: 'dark',
      featuredWalletIds,
      themeVariables: {
        '--w3m-accent': '#3694FF', // Nexis blue color
        '--w3m-border-radius-master': '8px',
      },
    });
    web3ModalInitialized = true;
    console.log("Web3Modal initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Web3Modal:", error);
  }
};

// Preload Web3Modal assets
if (typeof window !== 'undefined') {
  // Preload key assets to improve initial load time
  window.addEventListener('load', () => {
    // Use requestIdleCallback to initialize during browser idle time
    if ('requestIdleCallback' in window) {
      // TypeScript already has built-in types for these in lib.dom.d.ts
      window.requestIdleCallback(() => initializeWeb3Modal(), { timeout: 3000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(initializeWeb3Modal, 300);
    }
  });
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const initAttempted = useRef(false);

  useEffect(() => {
    if (!initAttempted.current) {
      initAttempted.current = true;
      
      try {
        // Initialize Web3Modal if not already done
        if (!web3ModalInitialized) {
          initializeWeb3Modal();
        }
        
        // Mark as mounted
        setMounted(true);
      } catch (error) {
        console.error("Error mounting WalletProvider:", error);
        setInitError(error instanceof Error ? error : new Error('Unknown wallet initialization error'));
      }
    }
  }, []);

  // Don't render anything until the component has mounted
  if (!mounted) {
    return null;
  }

  // Show error message if initialization failed
  if (initError) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <h3 className="font-semibold">Wallet connection error</h3>
        <p>There was an error connecting to Web3Modal: {initError.message}</p>
        <p>Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }

  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiConfig>
  );
} 