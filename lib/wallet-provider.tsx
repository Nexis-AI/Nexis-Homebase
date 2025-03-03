"use client";

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig, projectId, featuredWalletIds } from './wallet-config';
import { useEffect, useState, useRef } from 'react';
import type { ReactNode, PropsWithChildren } from 'react';
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
    
    // Log wallet detection status after initialization
    if (typeof window !== 'undefined') {
      console.log('Wallet detection status after Web3Modal init:', {
        injectedProvider: typeof window.ethereum !== 'undefined',
        isMetaMask: window._isMetaMask,
        hasExtension: window._hasWalletExtension,
        detectedWallets: window._walletProviders?.map(w => w.name) || []
      });
    }
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

export function WalletProvider({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      initializeWeb3Modal();
    } catch (err) {
      console.error("Error initializing Web3Modal in component:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
    
    // Log initial wallet state
    if (typeof window !== 'undefined') {
      const hasEthereum = typeof window.ethereum !== 'undefined';
      console.log('Initial wallet state:', {
        hasEthereum,
        providers: hasEthereum && window.ethereum ? Object.keys(window.ethereum) : [],
        ethereum: hasEthereum
      });
    }

    setMounted(true);
    
    // Check for MetaMask installation
    const checkMetaMask = () => {
      if (typeof window !== 'undefined') {
        const hasMetaMask = window._isMetaMask;
        console.log('MetaMask detection:', hasMetaMask ? 'Installed' : 'Not detected');
      }
    };
    
    // Check after a delay to allow injection
    setTimeout(checkMetaMask, 1000);
    
    return () => {
      // No cleanup needed
    };
  }, []);

  // Don't render anything until the component has mounted
  if (!mounted) {
    return null;
  }

  // Show error message if initialization failed
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <h3 className="font-semibold">Wallet connection error</h3>
        <p>There was an error connecting to Web3Modal: {error.message}</p>
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