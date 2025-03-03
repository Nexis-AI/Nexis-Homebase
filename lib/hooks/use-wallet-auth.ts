import { useState, useCallback } from 'react';
import { useWeb3Auth } from '../web3auth-fixed';
import type { ethers } from 'ethers';
import type { SafeEventEmitterProvider } from '@web3auth/base';
import { safeDisconnectWalletConnect } from '../wallet-disconnect-patch';

// Types for wallet authentication
export interface WalletAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  address: string | null;
  chainId: string | null;
  provider: SafeEventEmitterProvider | null;
  ethersProvider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  authMethod: 'web3auth' | 'walletconnect' | null;
  error: Error | null;
}

export interface WalletAuthActions {
  connectWithWeb3Auth: () => Promise<void>;
  connectWithWalletConnect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: string) => Promise<void>;
}

/**
 * Hook for wallet authentication using Web3Auth and WalletConnect
 * This is a wrapper around useWeb3Auth hook from the fixed implementation
 */
export function useWalletAuth(): WalletAuthState & WalletAuthActions {
  // Use our fixed Web3Auth hook
  const web3Auth = useWeb3Auth();
  
  // Additional state for wallet authentication
  const [authMethod, setAuthMethod] = useState<'web3auth' | 'walletconnect' | null>(null);
  
  // Connect with Web3Auth
  const connectWithWeb3Auth = useCallback(async () => {
    try {
      await web3Auth.login();
      setAuthMethod('web3auth');
    } catch (error) {
      console.error('Error connecting with Web3Auth:', error);
    }
  }, [web3Auth]);

  // Connect with WalletConnect - simplified to just delegate to the WalletConnect hook
  const connectWithWalletConnect = useCallback(async () => {
    try {
      // This is just a placeholder for now
      // In a full implementation, you'd connect with WalletConnect here
      console.log('WalletConnect connect called');
      setAuthMethod('walletconnect');
    } catch (error) {
      console.error('Error connecting with WalletConnect:', error);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      if (authMethod === 'web3auth') {
        await web3Auth.logout();
      } else if (authMethod === 'walletconnect') {
        // Handle WalletConnect disconnect using the patch
        // We would need the actual provider here
      }
      
      setAuthMethod(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, [authMethod, web3Auth]);

  // Switch chain
  const switchChain = useCallback(async (chainId: string) => {
    try {
      console.log(`Switching to chain ${chainId}`);
      // This would be implemented to switch chains
    } catch (error) {
      console.error('Error switching chain:', error);
    }
  }, []);

  return {
    isAuthenticated: web3Auth.isAuthenticated,
    isLoading: web3Auth.isLoading,
    address: web3Auth.walletAddress,
    chainId: '0x1', // Default to Ethereum mainnet for now
    provider: web3Auth.provider,
    ethersProvider: web3Auth.ethersProvider,
    signer: web3Auth.ethersSigner,
    authMethod,
    error: web3Auth.error,
    connectWithWeb3Auth,
    connectWithWalletConnect,
    disconnect,
    switchChain,
  };
} 