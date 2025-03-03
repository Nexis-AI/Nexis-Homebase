"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode, useMemo } from 'react';
import { CHAIN_NAMESPACES, IProvider, WALLET_ADAPTERS } from '@web3auth/base';
import { Web3Auth } from '@web3auth/modal';
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { BrowserProvider, Signer } from 'ethers';
import { trackWalletError, withTimeout } from './wallet-config';

// Configuration constants with environment fallbacks
const WEB3AUTH_CLIENT_ID = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || 
                           'BMvOeqT8mEVUifbchuHI9ZDbyaNz9bvIiEDg3rLn2QcNfJbpxdR-dWzPXaVx8I53dEAyYYsVJk6Q3__SYy85l04';
const WEB3AUTH_NETWORK = process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK || 'sapphire_mainnet';

// Chain configurations for Web3Auth
const CHAIN_CONFIG = {
  mainnet: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0x1',
    rpcTarget: 'https://eth.llamarpc.com',
    displayName: 'Ethereum Mainnet',
    blockExplorer: 'https://etherscan.io',
    ticker: 'ETH',
    tickerName: 'Ethereum',
  },
  polygon: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0x89',
    rpcTarget: 'https://polygon.llamarpc.com',
    displayName: 'Polygon Mainnet',
    blockExplorer: 'https://polygonscan.com',
    ticker: 'MATIC',
    tickerName: 'Polygon',
  },
  bsc: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0x38',
    rpcTarget: 'https://bsc.publicnode.com', 
    displayName: 'BNB Smart Chain',
    blockExplorer: 'https://bscscan.com',
    ticker: 'BNB',
    tickerName: 'BNB',
  },
  base: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0x2105',
    rpcTarget: 'https://base.llamarpc.com',
    displayName: 'Base',
    blockExplorer: 'https://basescan.org',
    ticker: 'ETH',
    tickerName: 'Ethereum',
  },
  arbitrum: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0xa4b1',
    rpcTarget: 'https://arbitrum.llamarpc.com',
    displayName: 'Arbitrum One',
    blockExplorer: 'https://arbiscan.io',
    ticker: 'ETH',
    tickerName: 'Ethereum',
  },
};

// Default chain to use
const DEFAULT_CHAIN = CHAIN_CONFIG.mainnet;

// Type definitions for Web3Auth user info
interface UserInfo {
  email?: string;
  name?: string;
  profileImage?: string;
  verifier?: string;
  verifierId?: string;
  typeOfLogin?: string;
  aggregateVerifier?: string;
  [key: string]: unknown;
}

// Type definitions for Web3Auth adapter config
type ModalConfig = Record<string, { label: string; showOnModal: boolean }>;

// Type definitions for the context
type Web3AuthContextType = {
  web3auth: Web3Auth | null;
  provider: IProvider | null;
  ethersProvider: BrowserProvider | null;
  signer: Signer | null;
  isInitialized: boolean;
  isLoading: boolean;
  isConnected: boolean;
  walletAddress: string | null;
  error: Error | null;
  chainId: string;
  setChainId: (chainId: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: string) => Promise<void>;
  userInfo: UserInfo | null;
};

// Create context with default values
const Web3AuthContext = createContext<Web3AuthContextType>({
  web3auth: null,
  provider: null,
  ethersProvider: null,
  signer: null,
  isInitialized: false,
  isLoading: false,
  isConnected: false,
  walletAddress: null,
  error: null,
  chainId: DEFAULT_CHAIN.chainId,
  setChainId: () => {},
  connect: async () => {},
  disconnect: async () => {},
  switchNetwork: async () => {},
  userInfo: null,
});

// Provider component properties
interface Web3AuthProviderProps {
  children: ReactNode;
}

// Get Web3Auth provider
export const Web3AuthProvider = ({ children }: Web3AuthProviderProps) => {
  // State
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [ethersProvider, setEthersProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [chainId, setChainId] = useState(DEFAULT_CHAIN.chainId);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  // Get the chain config based on chainId
  const getChainConfig = useCallback((chainIdToUse: string) => {
    // Find the chain config by chainId
    const chainConfig = Object.values(CHAIN_CONFIG).find((config) => config.chainId === chainIdToUse);
    
    // Return the chain config or default to mainnet
    return chainConfig || DEFAULT_CHAIN;
  }, []);

  // Initialize Web3Auth
  useEffect(() => {
    const initWeb3Auth = async () => {
      try {
        setIsLoading(true);
        
        const chainConfig = getChainConfig(chainId);
        
        // Create the private key provider
        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig },
        });
        
        // Create a new Web3Auth instance
        const web3authInstance = new Web3Auth({
          clientId: WEB3AUTH_CLIENT_ID,
          web3AuthNetwork: WEB3AUTH_NETWORK as any,
          privateKeyProvider: privateKeyProvider,
          uiConfig: {
            // Use a simple dark theme that doesn't require specific WHITE_LABEL_THEME type
            loginMethodsOrder: ['google', 'facebook', 'twitter', 'discord', 'github', 'apple', 'email_passwordless'],
            appLogo: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Nexis-Profile-Photo%20(1)%201-8LcRo5KayRrYjaJWdzJIkA1fdh4YZF.png',
          },
          // Use more appropriate storage key that web3auth accepts
          storageKey: "local",
          enableLogging: process.env.NODE_ENV === 'development',
        });
        
        // Initialize the modal with the appropriate adapter settings
        const modalConfig: ModalConfig = {};
        
        // Configure adapters that are supported
        modalConfig[WALLET_ADAPTERS.WALLET_CONNECT_V2] = {
          label: 'walletconnect',
          showOnModal: true,
        };
        
        modalConfig[WALLET_ADAPTERS.COINBASE] = {
          label: 'coinbase',
          showOnModal: true,
        };
        
        modalConfig[WALLET_ADAPTERS.TORUS_EVM] = {
          label: 'torus',
          showOnModal: true,
        };
        
        await withTimeout(web3authInstance.initModal({
          modalConfig
        }), 10000); // 10s timeout for initialization
        
        setWeb3auth(web3authInstance);
        setIsInitialized(true);
        
        // Check if already connected
        if (web3authInstance.connected) {
          const localProvider = web3authInstance.provider;
          if (localProvider) {
            setProvider(localProvider);
            await updateWalletInfo(localProvider);
            setIsConnected(true);
          }
        }
      } catch (error: unknown) {
        console.error('Web3Auth initialization error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        trackWalletError('web3auth_init', errorMessage || 'Failed to initialize Web3Auth');
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isInitialized) {
      initWeb3Auth();
    }
  }, [chainId, getChainConfig, isInitialized]);
  
  // Update wallet information after connection
  const updateWalletInfo = useCallback(async (web3Provider: IProvider) => {
    if (!web3Provider) return;
    
    try {
      // Create ethers provider from Web3Auth provider
      const etherProvider = new BrowserProvider(web3Provider as unknown);
      const signerInstance = await etherProvider.getSigner();
      const address = await signerInstance.getAddress();
      
      setEthersProvider(etherProvider);
      setSigner(signerInstance);
      setWalletAddress(address);
      
      // Get user info if available
      if (web3auth?.connected) {
        try {
          const userInfoData = await web3auth.getUserInfo();
          setUserInfo(userInfoData as UserInfo);
        } catch (e) {
          console.warn("Could not get user info", e);
        }
      }
    } catch (error: unknown) {
      console.error('Failed to update wallet info:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      trackWalletError('web3auth_wallet_info', errorMessage || 'Failed to get wallet information');
    }
  }, [web3auth]);
  
  // Connect wallet
  const connect = useCallback(async () => {
    if (!web3auth) {
      const notInitialized = new Error('Web3Auth not initialized yet');
      setError(notInitialized);
      throw notInitialized;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Connect with a timeout
      const web3Provider = await withTimeout(web3auth.connect(), 30000); // 30s timeout for connection
      
      if (web3Provider) {
        setProvider(web3Provider);
        await updateWalletInfo(web3Provider);
        setIsConnected(true);
        
        // Clear any previous errors
        setError(null);
        
        // Save connection state in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('wallet_autoconnect', 'true');
        }
      }
    } catch (error: unknown) {
      console.error('Web3Auth connection error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // User canceled error - don't treat as an actual error
      if (errorMessage.includes('User closed modal') || 
          errorMessage.includes('cancelled') || 
          errorMessage.includes('canceled')) {
        console.log('User cancelled login');
        setError(null);
      } else {
        trackWalletError('web3auth_connect', errorMessage || 'Failed to connect Web3Auth');
        setError(error instanceof Error ? error : new Error(String(error)));
      }
      
      // Reset state
      setIsConnected(false);
      setProvider(null);
      setEthersProvider(null);
      setSigner(null);
      setWalletAddress(null);
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [web3auth, updateWalletInfo]);
  
  // Disconnect wallet
  const disconnect = useCallback(async () => {
    if (!web3auth) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await web3auth.logout();
      
      // Clear session data
      setProvider(null);
      setEthersProvider(null);
      setSigner(null);
      setWalletAddress(null);
      setUserInfo(null);
      setIsConnected(false);
      
      // Clear localStorage autoconnect flag
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wallet_autoconnect');
      }
    } catch (error: unknown) {
      console.error('Web3Auth disconnection error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      trackWalletError('web3auth_disconnect', errorMessage || 'Failed to disconnect Web3Auth');
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  }, [web3auth]);
  
  // Switch network
  const switchNetwork = useCallback(async (newChainId: string) => {
    if (!web3auth || !web3auth.provider) {
      const notConnected = new Error('Please connect wallet first');
      setError(notConnected);
      throw notConnected;
    }
    
    setIsLoading(true);
    
    try {
      const chainConfig = getChainConfig(newChainId);
      
      // Switch chain using the provider
      await web3auth.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: newChainId }]
      });
      
      // Update chain ID
      setChainId(newChainId);
      
      // Update provider and wallet info
      await updateWalletInfo(web3auth.provider);
    } catch (error: unknown) {
      console.error('Failed to switch network:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      trackWalletError('web3auth_switch_network', errorMessage || 'Failed to switch network');
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [web3auth, getChainConfig, updateWalletInfo]);
  
  // Auto-connect on startup if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      // Only try to auto-connect if initialized, not connected yet, and have autoconnect flag
      if (isInitialized && !isConnected && !isLoading && web3auth) {
        const shouldAutoConnect = typeof window !== 'undefined' && 
                                 localStorage.getItem('wallet_autoconnect') === 'true';
        
        if (shouldAutoConnect) {
          try {
            await connect();
          } catch (error) {
            // Failed to auto-connect, clear the flag
            if (typeof window !== 'undefined') {
              localStorage.removeItem('wallet_autoconnect');
            }
          }
        }
      }
    };
    
    autoConnect();
  }, [isInitialized, isConnected, isLoading, web3auth, connect]);
  
  // Create the context value
  const contextValue = useMemo(() => ({
    web3auth,
    provider,
    ethersProvider,
    signer,
    isInitialized,
    isLoading,
    isConnected,
    walletAddress,
    error,
    chainId,
    setChainId,
    connect,
    disconnect,
    switchNetwork,
    userInfo,
  }), [
    web3auth,
    provider,
    ethersProvider,
    signer,
    isInitialized,
    isLoading,
    isConnected,
    walletAddress,
    error,
    chainId,
    connect,
    disconnect,
    switchNetwork,
    userInfo,
  ]);
  
  return (
    <Web3AuthContext.Provider value={contextValue}>
      {children}
    </Web3AuthContext.Provider>
  );
};

// Custom hook to use the Web3Auth context
export const useWeb3Auth = () => useContext(Web3AuthContext); 