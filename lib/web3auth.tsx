"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import type { IProvider } from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { ethers } from "ethers";

interface UserInfo {
  email?: string;
  name?: string;
  profileImage?: string;
  verifier?: string;
  verifierId?: string;
  aggregateVerifier?: string;
  typeOfLogin?: string;
  dappShare?: string;
  idToken?: string;
  oAuthIdToken?: string;
  oAuthAccessToken?: string;
}

interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  provider: IProvider | null;
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  walletAddress: string | null;
  ethersProvider: ethers.BrowserProvider | null;
  ethersSigner: ethers.Signer | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const Web3AuthContext = createContext<Web3AuthContextType | null>(null);

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error("useWeb3Auth must be used within a Web3AuthProvider");
  }
  return context;
};

export const Web3AuthProvider = ({ children }: { children: ReactNode }) => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ethersProvider, setEthersProvider] = useState<ethers.BrowserProvider | null>(null);
  const [ethersSigner, setEthersSigner] = useState<ethers.Signer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Skip initialization when rendering on the server
        if (typeof window === "undefined") return;

        const clientId = "BEMwl6aZFyj8ad1nu0UPVxi2o-XCsfVnV33fzXmH2WfZMH5llJt4Q-rqn7TzQvTVkWBtzP5v2_urP1PXXAqPEYo";
        
        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: "0x1", // Ethereum mainnet
          rpcTarget: "https://ethereum.publicnode.com", // Updated to a more reliable RPC endpoint
          displayName: "Ethereum Mainnet",
          blockExplorer: "https://etherscan.io",
          ticker: "ETH",
          tickerName: "Ethereum",
        };
        
        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig },
        });

        const web3authInstance = new Web3Auth({
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
          chainConfig,
          privateKeyProvider,
          // Removed custom UI configuration that requires paid plan
        });

        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            clientId,
            network: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
            uxMode: "popup",
          },
        });
        
        // @ts-ignore - The Web3Auth types might be outdated
        web3authInstance.configureAdapter(openloginAdapter);
        
        setWeb3auth(web3authInstance);
        
        await web3authInstance.initModal();
        
        setIsInitialized(true);
        
        if (web3authInstance.connected) {
          const provider = web3authInstance.provider;
          const userInfo = await web3authInstance.getUserInfo();
          
          setProvider(provider);
          setUser(userInfo);
          setIsAuthenticated(true);
          
          if (provider) {
            const ethersProvider = new ethers.BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            const address = await signer.getAddress();
            
            setEthersProvider(ethersProvider);
            setEthersSigner(signer);
            setWalletAddress(address);
          }
        }
      } catch (error) {
        console.error("Error initializing Web3Auth", error);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      console.error("Web3Auth not initialized");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const provider = await web3auth.connect();
      const userInfo = await web3auth.getUserInfo();
      
      setProvider(provider);
      setUser(userInfo);
      setIsAuthenticated(true);
      
      if (provider) {
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const address = await signer.getAddress();
        
        setEthersProvider(ethersProvider);
        setEthersSigner(signer);
        setWalletAddress(address);
      }
    } catch (error) {
      console.error("Error logging in with Web3Auth", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!web3auth) {
      console.error("Web3Auth not initialized");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await web3auth.logout();
      
      setProvider(null);
      setUser(null);
      setIsAuthenticated(false);
      setEthersProvider(null);
      setEthersSigner(null);
      setWalletAddress(null);
    } catch (error) {
      console.error("Error logging out with Web3Auth", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Web3AuthContext.Provider
      value={{
        web3auth,
        provider,
        user,
        isLoading,
        isAuthenticated,
        isInitialized,
        walletAddress,
        ethersProvider,
        ethersSigner,
        login,
        logout,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
}; 