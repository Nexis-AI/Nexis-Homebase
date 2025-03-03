"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Web3Auth } from "@web3auth/modal";
import {
  CHAIN_NAMESPACES,
  type SafeEventEmitterProvider,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { BrowserProvider, Signer } from "ethers";

// Define interface for our context
interface Web3AuthContextType {
  isInitialized: boolean;
  isLoading: boolean;
  isConnected: boolean;
  walletAddress: string | null;
  provider: SafeEventEmitterProvider | null;
  ethersProvider: BrowserProvider | null;
  ethersSigner: Signer | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: Error | null;
}

// Create context
const Web3AuthContext = createContext<Web3AuthContextType>({
  isInitialized: false,
  isLoading: false, 
  isConnected: false,
  walletAddress: null,
  provider: null,
  ethersProvider: null,
  ethersSigner: null,
  connect: async () => { throw new Error("Not implemented"); },
  disconnect: async () => { throw new Error("Not implemented"); },
  error: null
});

// Hook to use the web3 auth context
export function useWeb3Auth() {
  return useContext(Web3AuthContext);
}

// Provider component
export function Web3AuthProvider({ children }: { children: React.ReactNode }) {
  // State variables
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null);
  const [ethersProvider, setEthersProvider] = useState<BrowserProvider | null>(null);
  const [ethersSigner, setEthersSigner] = useState<Signer | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize Web3Auth
  useEffect(() => {
    const initWeb3Auth = async () => {
      try {
        // Get client ID from environment
        const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
        if (!clientId) {
          throw new Error("Missing Web3Auth client ID");
        }

        // Create Web3Auth instance
        const web3AuthInstance = new Web3Auth({
          clientId,
          web3AuthNetwork: "sapphire_mainnet",
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: "0x1", // Ethereum Mainnet
            rpcTarget: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID || ''}`
          }
        });

        // Initialize Web3Auth
        await web3AuthInstance.initModal();
        setWeb3auth(web3AuthInstance);
        setIsInitialized(true);

        // Check if already logged in
        if (web3AuthInstance.connected) {
          const web3Provider = web3AuthInstance.provider;
          if (web3Provider) {
            setProvider(web3Provider);
            setIsConnected(true);

            // Set up ethers provider and signer
            const ethProvider = new BrowserProvider(web3Provider);
            const signer = await ethProvider.getSigner();
            const address = await signer.getAddress();

            setEthersProvider(ethProvider);
            setEthersSigner(signer);
            setWalletAddress(address);
          }
        }
      } catch (err) {
        console.error("Failed to initialize Web3Auth", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    // Only run in browser
    if (typeof window !== "undefined") {
      initWeb3Auth();
    }

    // Cleanup
    return () => {
      // Nothing to clean up
    };
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!web3auth || !isInitialized) {
      console.error("Web3Auth not initialized");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Connect with Web3Auth
      const web3Provider = await web3auth.connect();
      setProvider(web3Provider);
      setIsConnected(true);

      if (web3Provider) {
        // Set up ethers provider
        const ethProvider = new BrowserProvider(web3Provider);
        const signer = await ethProvider.getSigner();
        const address = await signer.getAddress();

        setEthersProvider(ethProvider);
        setEthersSigner(signer);
        setWalletAddress(address);
      }
    } catch (err) {
      console.error("Failed to connect Web3Auth", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [web3auth, isInitialized]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    if (!web3auth) {
      console.error("Web3Auth not initialized");
      return;
    }

    try {
      setIsLoading(true);

      // Logout from Web3Auth
      await web3auth.logout();

      // Reset state
      setProvider(null);
      setEthersProvider(null);
      setEthersSigner(null);
      setWalletAddress(null);
      setIsConnected(false);
    } catch (err) {
      console.error("Failed to disconnect Web3Auth", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [web3auth]);

  // Context value
  const contextValue = {
    isInitialized,
    isLoading,
    isConnected,
    walletAddress,
    provider,
    ethersProvider,
    ethersSigner,
    connect,
    disconnect,
    error
  };

  // Render provider
  return (
    <Web3AuthContext.Provider value={contextValue}>
      {children}
    </Web3AuthContext.Provider>
  );
}

export default Web3AuthProvider; 