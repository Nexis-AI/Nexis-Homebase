"use client";

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig, projectId, featuredWalletIds } from './wallet-config';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client for React Query with retry settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Retry failed queries twice (3 attempts total)
      retryDelay: 1000, // 1s delay between retries
      staleTime: 30 * 1000, // 30s stale time
      networkMode: 'online', // Only make requests when online
    },
  },
});

// Create Web3Modal with customized styling
if (typeof window !== 'undefined' && projectId) {
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
    console.log("Web3Modal initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Web3Modal:", error);
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      setMounted(true);
    } catch (error) {
      console.error("Error mounting WalletProvider:", error);
      setInitError(error instanceof Error ? error : new Error('Unknown wallet initialization error'));
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