import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import type { EthereumProvider } from '@walletconnect/ethereum-provider';

// Define interfaces for WalletConnect
interface WalletConnectProvider {
  connect: () => Promise<void>;
  disconnect?: () => Promise<void>;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string | symbol, listener: (data: unknown) => void) => void;
  off: (event: string | symbol, listener: (data: unknown) => void) => void;
  [key: string]: unknown;
}

interface WalletConnectState {
  provider: WalletConnectProvider | null;
  address: string | null;
  chainId: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: Error | null;
}

interface WalletConnectOptions {
  projectId: string;
  chains?: number[];
  showQrModal?: boolean;
  metadata?: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

export function useWalletConnect(options?: WalletConnectOptions) {
  const [state, setState] = useState<WalletConnectState>({
    provider: null,
    address: null,
    chainId: null,
    isConnecting: false,
    isConnected: false,
    error: null
  });

  // Safely disconnect the provider
  const disconnect = useCallback(async () => {
    const { provider } = state;
    if (!provider) return;

    try {
      setState(prev => ({ ...prev, isConnecting: true }));

      // Try to use the standard disconnect method if available
      if (typeof provider.disconnect === 'function') {
        await provider.disconnect();
      }

      // Always clean up localStorage items regardless of disconnect method availability
      if (typeof window !== 'undefined') {
        localStorage.removeItem('walletconnect');
        localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
      }

      setState({
        provider: null,
        address: null,
        chainId: null,
        isConnecting: false,
        isConnected: false,
        error: null
      });
    } catch (error) {
      console.error('Error disconnecting from WalletConnect:', error);
      
      // Clean up localStorage anyway as a fallback
      if (typeof window !== 'undefined') {
        localStorage.removeItem('walletconnect');
        localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
      }
      
      // Reset the state
      setState({
        provider: null,
        address: null,
        chainId: null,
        isConnecting: false,
        isConnected: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  }, [state]);

  // Connect to WalletConnect
  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      // Use dynamic import to avoid SSR issues
      const { default: EthereumProvider } = await import('@walletconnect/ethereum-provider');
      
      const defaultOptions: WalletConnectOptions = {
        projectId: options?.projectId || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
        chains: options?.chains || [1], // Default to Ethereum mainnet
        showQrModal: options?.showQrModal !== false, // Default to true
        metadata: options?.metadata || {
          name: 'Nexis Dashboard',
          description: 'Nexis Network Dashboard',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://nexisnetwork.io',
          icons: ['https://nexisnetwork.io/logo.png']
        }
      };

      // Initialize provider with proper v2 configuration
      const wcProvider = await EthereumProvider.init({
        projectId: defaultOptions.projectId,
        chains: defaultOptions.chains || [1],
        optionalChains: [1, 137, 56, 42161], // Add popular chains as optional
        showQrModal: defaultOptions.showQrModal ?? true,
        methods: ["eth_sendTransaction", "personal_sign", "eth_sign", "eth_signTypedData_v4"],
        events: ["chainChanged", "accountsChanged", "disconnect", "connect"],
        metadata: defaultOptions.metadata
      });

      // Connect and show QR modal
      await wcProvider.connect();
      
      // Get address and chain information
      const accounts = await wcProvider.request({ method: 'eth_accounts' }) as string[];
      const chainId = await wcProvider.request({ method: 'eth_chainId' }) as string;
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet');
      }

      const address = accounts[0];
      
      // Set up disconnect listener
      const handleDisconnect = () => {
        console.log('WalletConnect disconnected by wallet');
        disconnect();
      };
      
      // Remove any existing listeners to avoid duplicates
      wcProvider.off('disconnect', handleDisconnect);
      
      // Add new listener
      wcProvider.on('disconnect', handleDisconnect);

      setState({
        provider: wcProvider as unknown as WalletConnectProvider,
        address,
        chainId,
        isConnecting: false,
        isConnected: true,
        error: null
      });

      return {
        provider: wcProvider,
        address,
        chainId,
        ethersProvider: new ethers.BrowserProvider(wcProvider)
      };
    } catch (error) {
      console.error('Error connecting to WalletConnect:', error);
      setState({
        provider: null,
        address: null,
        chainId: null,
        isConnecting: false,
        isConnected: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  }, [disconnect, options]);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      if (typeof window === 'undefined') return;
      
      // Check if we have a WalletConnect session in localStorage
      const wcSession = localStorage.getItem('walletconnect');
      if (wcSession) {
        try {
          const session = JSON.parse(wcSession);
          if (session?.connected) {
            // There's an active session, try to reconnect
            await connect();
          }
        } catch (error) {
          console.warn('Failed to parse or reconnect WalletConnect session:', error);
          // Clean up the invalid session
          localStorage.removeItem('walletconnect');
        }
      }
    };
    
    checkExistingSession();
  }, [connect]);

  return {
    ...state,
    connect,
    disconnect,
    request: useCallback(async (args: { method: string; params?: unknown[] }) => {
      if (!state.provider || !state.isConnected) {
        throw new Error('Not connected to WalletConnect');
      }
      return state.provider.request(args);
    }, [state.provider, state.isConnected]),
    getSigner: useCallback(async () => {
      if (!state.provider || !state.isConnected) {
        throw new Error('Not connected to WalletConnect');
      }
      
      const ethersProvider = new ethers.BrowserProvider(state.provider as WalletConnectProvider);
      return ethersProvider.getSigner();
    }, [state.provider, state.isConnected])
  };
} 