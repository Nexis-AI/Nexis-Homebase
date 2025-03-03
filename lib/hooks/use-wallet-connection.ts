import { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect, useWalletClient } from 'wagmi';
import { toast } from 'sonner';
import { BrowserProvider } from 'ethers';
import type { Signer } from 'ethers';
import type { SafeEventEmitterProvider } from '@web3auth/base';
import type { 
  ConnectionMethod, 
  ConnectionMetrics, 
  WalletInfo
} from '../auth-service';
import { 
  formatAddress as formatWalletAddress,
  getConnectionMetrics,
  getRecentWallets,
  initializeWeb3Modal,
  loadSavedWallets,
  recordSuccessfulConnection,
  recordFailedConnection,
  clearPendingConnections
} from '../auth-service';
import { safeDisconnectWalletConnect } from '../wallet-disconnect-patch';

// Connection retry delay in ms
const CONNECTION_RETRY_DELAY = 1000;
const MAX_CONNECTION_RETRIES = 2;

/**
 * Hook for managing wallet connection
 */
export function useWalletConnection() {
  // Web3Modal for WalletConnect
  const { open } = useWeb3Modal();
  
  // WAGMI account and client state
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  
  // Local state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Connection tracking refs
  const connectionAttemptRef = useRef<number>(0);
  const hasActiveRequestRef = useRef<boolean>(false);
  
  // Wallet state
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null);
  const [ethersProvider, setEthersProvider] = useState<BrowserProvider | null>(null);
  const [ethersSigner, setEthersSigner] = useState<Signer | null>(null);
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>('unknown');
  
  // Recent wallets and metrics
  const [recentWallets, setRecentWallets] = useState<WalletInfo[]>([]);
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>({
    connectionAttempts: 0,
    successfulConnections: 0,
    failedConnections: 0
  });
  
  // Update connection metrics
  const updateMetrics = useCallback(() => {
    setConnectionMetrics(getConnectionMetrics());
    setRecentWallets(getRecentWallets());
  }, []);

  // Initialize the wallet connection system
  useEffect(() => {
    // Skip server-side rendering
    if (typeof window === 'undefined') return;
    
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Clear any pending connections from previous sessions
        clearPendingConnections();
        
        // Initialize Web3Modal
        initializeWeb3Modal();
        
        // Load saved wallets
        loadSavedWallets();
        
        // Update state
        updateMetrics();
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing wallet connection:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
    
    // Cleanup event listeners on unmount
    return () => {
      clearPendingConnections();
    };
  }, [updateMetrics]);
  
  /**
   * Attempt to connect with retry logic if active request error occurs
   */
  const attemptConnection = useCallback(async (retryCount = 0): Promise<void> => {
    try {
      // Set connection flag
      hasActiveRequestRef.current = true;
      
      // Open Web3Modal to trigger connection
      await open();
      
      // Connection was successful
      connectionAttemptRef.current = 0;
      hasActiveRequestRef.current = false;
      
    } catch (err) {
      // Check if this is a "previous request is still active" error
      const errorMsg = err instanceof Error ? err.message : String(err);
      
      if (
        errorMsg.includes('previous request is still active') ||
        errorMsg.includes('can be declined if a previous') ||
        errorMsg.includes('Connection request declined')
      ) {
        // This is the specific error we're trying to handle
        console.warn(`Previous connection request still active (attempt ${retryCount + 1})`);
        
        if (retryCount < MAX_CONNECTION_RETRIES) {
          // Wait and retry with exponential backoff
          const delay = CONNECTION_RETRY_DELAY * (retryCount + 1);
          console.log(`Retrying connection in ${delay}ms...`);
          
          // Clear the active request flag
          hasActiveRequestRef.current = false;
          
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptConnection(retryCount + 1);
        }
      }
      
      // For other errors or if we've exceeded retries, rethrow
      hasActiveRequestRef.current = false;
      throw err;
    }
  }, [open]);
  
  // Connect wallet function
  const connect = useCallback(async () => {
    if (!isInitialized) {
      console.error('Wallet connection not initialized');
      return;
    }
    
    if (isConnecting || hasActiveRequestRef.current) {
      console.warn('Connection already in progress, please wait');
      toast.warning("Connection in progress, please wait");
      return;
    }
    
    // Increment connection attempt counter
    connectionAttemptRef.current++;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Clear any pending connections first
      clearPendingConnections();
      
      // Wait a moment to ensure previous connections are cleared
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const startTime = performance.now();
      
      // Attempt connection with retry logic
      await attemptConnection();
      
      // The actual connection will be handled by the useAccount hook
      // which will trigger a state update when connected
      
    } catch (err) {
      console.error('Connection failed', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      recordFailedConnection(err);
      
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('User rejected')) {
        toast.error("Connection rejected by user");
      } else {
        toast.error("Failed to connect wallet");
      }
    } finally {
      connectionAttemptRef.current = 0;
      hasActiveRequestRef.current = false;
      setIsConnecting(false);
    }
  }, [isInitialized, isConnecting, attemptConnection]);
  
  // Disconnect wallet function
  const disconnect = useCallback(async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    
    try {
      // Try WalletConnect specific disconnect if provider is available
      if (provider) {
        await safeDisconnectWalletConnect(provider);
      }
      
      // Disconnect wagmi
      await wagmiDisconnect();
      
      // Reset state
      setWalletAddress(null);
      setProvider(null);
      setEthersProvider(null);
      setEthersSigner(null);
      setIsConnected(false);
      setConnectionMethod('unknown');
      
      toast.success("Wallet disconnected");
    } catch (err) {
      console.error('Disconnect failed', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to disconnect wallet");
    } finally {
      setIsLoading(false);
      updateMetrics();
    }
  }, [isConnected, provider, wagmiDisconnect, updateMetrics]);
  
  // Update state when wagmi connection changes
  useEffect(() => {
    const updateConnection = async () => {
      try {
        // Skip if we're actively connecting/disconnecting
        if (isConnecting || isLoading) return;
        
        if (wagmiConnected && wagmiAddress && walletClient) {
          // Update our internal state if we're not already connected
          // or if the address has changed
          if (!isConnected || walletAddress !== wagmiAddress) {
            setIsConnecting(true);
            
            try {
              const startTime = performance.now();
              
              // Get provider from wallet client
              const rawProvider = walletClient.transport.provider as SafeEventEmitterProvider;
              
              // Create ethers provider from wallet
              const provider = new BrowserProvider(rawProvider || window.ethereum);
              const signer = await provider.getSigner();
              
              // Calculate connection time
              const connectionTime = performance.now() - startTime;
              
              // Detect connection method
              let method: ConnectionMethod = 'wagmi';
              
              // Try to detect the connection method from the provider or client
              const providerInfo = walletClient.transport.info;
              
              if (providerInfo) {
                if (providerInfo.name.toLowerCase().includes('metamask')) {
                  method = 'metamask';
                } else if (providerInfo.name.toLowerCase().includes('walletconnect')) {
                  method = 'walletconnect';
                } else if (providerInfo.name.toLowerCase().includes('web3auth')) {
                  method = 'web3auth';
                } else if (providerInfo.name.toLowerCase().includes('coinbase')) {
                  method = 'injected';
                }
              }
              
              // Record successful connection
              const result = recordSuccessfulConnection(
                wagmiAddress,
                method,
                connectionTime,
                rawProvider,
                provider,
                signer
              );
              
              // Update internal state
              setWalletAddress(result.address);
              setProvider(result.provider || null);
              setEthersProvider(result.ethersProvider || null);
              setEthersSigner(result.ethersSigner || null);
              setConnectionMethod(result.method);
              setIsConnected(true);
              
              // Update UI metrics
              updateMetrics();
              
            } catch (err) {
              console.error('Error updating wallet connection:', err);
              recordFailedConnection(err);
            } finally {
              setIsConnecting(false);
            }
          }
        } else if (isConnected) {
          // We're connected in our state but not in wagmi
          // This means we need to disconnect
          setWalletAddress(null);
          setProvider(null);
          setEthersProvider(null);
          setEthersSigner(null);
          setIsConnected(false);
          setConnectionMethod('unknown');
          updateMetrics();
        }
      } catch (err) {
        console.error('Error in connection effect:', err);
      }
    };
    
    updateConnection();
  }, [wagmiConnected, wagmiAddress, walletClient, isConnected, walletAddress, isConnecting, isLoading, updateMetrics]);
  
  // Get preferred connection method
  const preferredConnectionMethod = recentWallets.length > 0 
    ? recentWallets[0].method 
    : 'wagmi';
  
  // Last connected wallet
  const lastConnectedWallet = recentWallets.length > 0 ? recentWallets[0] : null;
  
  return {
    // Connection state
    isInitialized,
    isLoading,
    isConnecting,
    isConnected,
    walletAddress,
    error,
    
    // Wallet details
    provider,
    ethersProvider,
    ethersSigner,
    connectionMethod,
    
    // Connection history
    recentWallets,
    lastConnectedWallet,
    preferredConnectionMethod,
    connectionMetrics,
    
    // Actions
    connect,
    disconnect,
    
    // Utils
    formatAddress: formatWalletAddress
  };
} 