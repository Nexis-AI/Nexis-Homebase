/**
 * This is a utility patch to handle WalletConnect disconnection issues
 * It provides a safe way to disconnect WalletConnect by trying different methods
 * and clearing local storage as a fallback
 */

import type { SafeEventEmitterProvider } from "@web3auth/base";

// Define a basic interface to match the shape of the provider
interface WalletConnectProvider {
  disconnect?: () => Promise<void>;
  close?: () => Promise<void>;
  reset?: () => Promise<void>;
  transportClose?: () => Promise<void>;
  provider?: {
    disconnect?: () => Promise<void>;
  };
  [key: string]: unknown;
}

/**
 * Safely disconnects a WalletConnect provider by trying multiple approaches
 * to handle both v1 and v2 providers
 */
export async function safeDisconnectWalletConnect(
  // Accept either WalletConnectProvider or SafeEventEmitterProvider
  provider: WalletConnectProvider | SafeEventEmitterProvider | unknown
): Promise<void> {
  if (!provider) return;

  // Cast to our interface to access properties safely
  const wcProvider = provider as WalletConnectProvider;

  try {
    // Try to use the standard disconnect method if available (v2)
    if (typeof wcProvider.disconnect === 'function') {
      await wcProvider.disconnect();
      console.log('Successfully disconnected WalletConnect using disconnect()');
      return;
    }

    // Try alternative methods (for v1 or other variants)
    if (typeof wcProvider.close === 'function') {
      await wcProvider.close();
      console.log('Successfully disconnected WalletConnect using close()');
      return;
    }

    if (typeof wcProvider.reset === 'function') {
      await wcProvider.reset();
      console.log('Successfully disconnected WalletConnect using reset()');
      return;
    }
    
    if (typeof wcProvider.transportClose === 'function') {
      await wcProvider.transportClose();
      console.log('Successfully disconnected WalletConnect using transportClose()');
      return;
    }

    if (wcProvider.provider && typeof wcProvider.provider.disconnect === 'function') {
      await wcProvider.provider.disconnect();
      console.log('Successfully disconnected WalletConnect using provider.disconnect()');
      return;
    }

    // If all else fails, log a warning
    console.warn('No disconnect method found on WalletConnect provider, falling back to manual cleanup');
  } catch (error) {
    console.warn('Error during WalletConnect disconnect:', error);
  }

  // Always clean up localStorage as a final fallback
  if (typeof window !== 'undefined') {
    localStorage.removeItem('walletconnect');
    localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
    console.log('Cleaned up WalletConnect localStorage items');
  }
}

/**
 * Helper function to check if a WalletConnect session exists
 */
export function hasWalletConnectSession(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('walletconnect');
}

/**
 * Helper function to clear a WalletConnect session
 */
export function clearWalletConnectSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('walletconnect');
  localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
} 