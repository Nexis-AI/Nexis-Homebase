"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import {
  getWalletTokenBalances,
  getTokenPrice,
  getWalletTransactions,
  getWalletNFTs,
  getTokenMetadata,
} from '../moralis-client';
import { getPortfolioHistory as getPortfolioDataFromService, type PortfolioHistoryData } from '../portfolio-service';

// Supported chains configuration with their chainIds
export const SUPPORTED_CHAINS = [
  { id: '0x1', name: 'Ethereum' },
  { id: '0x89', name: 'Polygon' },
  { id: '0xa86a', name: 'Avalanche' },
  { id: '0x38', name: 'BSC' },
  { id: '0xfa', name: 'Fantom' },
  { id: '0xa', name: 'Optimism' },
  { id: '0xa4b1', name: 'Arbitrum' },
];

// Type definitions for API responses
interface TokenBalanceResponse {
  nativeBalance?: {
    balance: string;
  };
  tokenBalances?: Array<{
    token_address: string;
    name: string;
    symbol: string;
    logo?: string;
    thumbnail?: string;
    decimals: number;
    balance: string;
    possible_spam?: boolean;
  }>;
}

// Define the NFT types to match the actual API response structure
interface NFTAttributeResponse {
  trait_type?: string;
  value?: string | number | { [key: string]: unknown };
  display_type?: string;
  max_value?: number;
  trait_count?: number;
  order?: number;
}

interface NFTMetadataResponse {
  name?: string;
  description?: string;
  image?: string;
  external_link?: string;
  animation_url?: string;
  attributes?: NFTAttributeResponse[];
}

interface NFTItemResponse {
  token_address: string;
  token_id: string;
  contract_type: string;
  owner_of?: string;
  block_number?: string;
  block_number_minted?: string;
  token_uri?: string;
  metadata?: string;
  amount?: string;
  name: string;
  symbol: string;
  possible_spam?: boolean;
  verified_collection?: boolean;
  normalized_metadata?: NFTMetadataResponse;
}

interface NFTResponse {
  nfts: {
    result: NFTItemResponse[];
  };
}

interface TransactionResponse {
  transactions: {
    result: Array<{
      hash: string;
      from_address: string;
      to_address: string;
      value: string;
      gas: string;
      gas_price: string;
      block_timestamp: string;
      block_number: string;
      block_hash: string;
    }>;
  };
  tokenTransfers: {
    result: Array<{
      transaction_hash: string;
      address: string;
      block_timestamp: string;
      block_number: string;
      block_hash: string;
      to_address: string;
      from_address: string;
      value: string;
      token_address: string;
      token_name?: string;
      token_symbol?: string;
      token_decimals?: number;
      token_logo?: string;
    }>;
  };
}

export interface MoralisToken {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  possible_spam?: boolean;
  chain: string;
  chainName: string;
  usdPrice?: number;
  tokenValue?: number;
}

// Simplified and normalized attributes structure for our app
export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface MoralisNFT {
  token_address: string;
  token_id: string;
  contract_type: string;
  name: string;
  symbol: string;
  token_uri?: string;
  metadata?: string;
  amount?: string;
  chain: string;
  chainName: string;
  normalized_metadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: NFTAttribute[];
  };
}

export interface MoralisTransaction {
  hash: string;
  from_address: string;
  to_address: string;
  value: string;
  gas: string;
  gas_price: string;
  block_timestamp: string;
  block_number: string;
  block_hash: string;
  chain: string;
  chainName: string;
}

export interface MoralisTokenTransfer {
  transaction_hash: string;
  address: string;
  block_timestamp: string;
  block_number: string;
  block_hash: string;
  to_address: string;
  from_address: string;
  value: string;
  token_address: string;
  token_name?: string;
  token_symbol?: string;
  token_decimals?: number;
  token_logo?: string;
  chain: string;
  chainName: string;
}

export interface ChainData {
  tokens: MoralisToken[];
  nfts: MoralisNFT[];
  transactions: MoralisTransaction[];
  tokenTransfers: MoralisTokenTransfer[];
  isLoading: boolean;
}

export interface MoralisData {
  byChain: Record<string, ChainData>;
  allTokens: MoralisToken[];
  allNfts: MoralisNFT[];
  allTransactions: MoralisTransaction[];
  allTokenTransfers: MoralisTokenTransfer[];
  totalBalanceUsd: number;
  isLoading: boolean;
  error: Error | null;
  refetch: (chains?: string[]) => Promise<void>;
  getTokenLogos: (tokenAddresses: string[], chainId?: string) => Promise<Record<string, string>>;
  getPortfolioHistory: (address?: string, days?: number, chainId?: string) => Promise<PortfolioHistoryData | null>;
}

interface UseMoralisDataProps {
  chains?: string[];
  enabled?: boolean;
  refreshInterval?: number | null;
}

/**
 * Custom hook to fetch data from multiple chains using Moralis API
 */
export function useMoralisData(props?: UseMoralisDataProps): MoralisData {
  const { chains = SUPPORTED_CHAINS.map(chain => chain.id), enabled = true, refreshInterval = null } = props || {};
  const { address, isConnected } = useAccount();
  
  // Initialize chain data structure
  const initialChainData = chains.reduce((acc, chainId) => {
    acc[chainId] = {
      tokens: [],
      nfts: [],
      transactions: [],
      tokenTransfers: [],
      isLoading: false
    };
    return acc;
  }, {} as Record<string, ChainData>);
  
  const [chainData, setChainData] = useState<Record<string, ChainData>>(initialChainData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs to track state changes to prevent unnecessary re-renders
  const addressRef = useRef<string | undefined>(address);
  const isConnectedRef = useRef<boolean>(isConnected);
  const chainsRef = useRef<string[]>(chains);
  const isFetchingRef = useRef<Record<string, boolean>>({});

  // Helper to get chain name from ID
  const getChainName = useCallback((chainId: string): string => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    return chain?.name || 'Unknown Chain';
  }, []);

  // Convert NFT API response to our app's format
  const convertToMoralisNFT = useCallback((nft: NFTItemResponse, chainId: string, chainName: string): MoralisNFT => {
    // Normalize the attributes if they exist to ensure they match our expected format
    const normalizedAttributes = nft.normalized_metadata?.attributes?.map(attr => {
      if (!attr.trait_type) return null;
      
      // Ensure value is a string or number
      let normalizedValue: string | number;
      if (typeof attr.value === 'string' || typeof attr.value === 'number') {
        normalizedValue = attr.value;
      } else if (attr.value && typeof attr.value === 'object') {
        // If it's a complex object, stringify it
        normalizedValue = JSON.stringify(attr.value);
      } else {
        normalizedValue = '';
      }
      
      return {
        trait_type: attr.trait_type,
        value: normalizedValue,
        display_type: attr.display_type
      };
    }).filter(Boolean) as NFTAttribute[] | undefined;
    
    return {
      token_address: nft.token_address,
      token_id: nft.token_id,
      contract_type: nft.contract_type,
      name: nft.name,
      symbol: nft.symbol,
      token_uri: nft.token_uri,
      metadata: nft.metadata,
      amount: nft.amount,
      chain: chainId,
      chainName,
      normalized_metadata: nft.normalized_metadata ? {
        name: nft.normalized_metadata.name,
        description: nft.normalized_metadata.description,
        image: nft.normalized_metadata.image,
        attributes: normalizedAttributes
      } : undefined
    };
  }, []);

  // Create a stable fetch function for a specific chain
  const fetchChainData = useCallback(async (walletAddress: string, chainId: string) => {
    if (isFetchingRef.current[chainId]) {
      return;
    }
    
    isFetchingRef.current[chainId] = true;
    setChainData(prev => ({
      ...prev,
      [chainId]: {
        ...prev[chainId],
        isLoading: true
      }
    }));

    try {
      // Fetch all data for this chain in parallel
      const [balancesResult, nftsResult, transactionsResult] = await Promise.all([
        getWalletTokenBalances(walletAddress, chainId) as Promise<TokenBalanceResponse>,
        getWalletNFTs(walletAddress, chainId).catch(err => {
          console.error(`Error fetching NFTs for chain ${chainId}:`, err);
          return { nfts: { result: [] } } as NFTResponse;
        }),
        getWalletTransactions(walletAddress, chainId).catch(err => {
          console.error(`Error fetching transactions for chain ${chainId}:`, err);
          return { 
            transactions: { result: [] }, 
            tokenTransfers: { result: [] } 
          } as TransactionResponse;
        })
      ]);

      // Process token balances and add chain info and USD prices
      let tokens: MoralisToken[] = [];
      const chainName = getChainName(chainId);
      
      // Process native token balance
      if (balancesResult.nativeBalance) {
        const nativeToken: MoralisToken = {
          token_address: '0x0000000000000000000000000000000000000000',
          name: chainName === 'Ethereum' ? 'Ethereum' : 
                chainName === 'Polygon' ? 'Polygon' :
                chainName === 'Avalanche' ? 'Avalanche' :
                chainName === 'BSC' ? 'BNB' :
                chainName === 'Fantom' ? 'Fantom' :
                chainName === 'Optimism' ? 'Optimism' :
                chainName === 'Arbitrum' ? 'Arbitrum' : 'Native Token',
          symbol: chainName === 'Ethereum' ? 'ETH' : 
                  chainName === 'Polygon' ? 'MATIC' :
                  chainName === 'Avalanche' ? 'AVAX' :
                  chainName === 'BSC' ? 'BNB' :
                  chainName === 'Fantom' ? 'FTM' :
                  chainName === 'Optimism' ? 'ETH' :
                  chainName === 'Arbitrum' ? 'ETH' : 'NATIVE',
          decimals: 18,
          balance: balancesResult.nativeBalance.balance || '0',
          chain: chainId,
          chainName
        };
        tokens.push(nativeToken);
      }

      // Process ERC20 token balances
      if (balancesResult.tokenBalances && balancesResult.tokenBalances.length > 0) {
        const tokenBalances = balancesResult.tokenBalances.map((token) => ({
          ...token,
          chain: chainId,
          chainName
        }));
        tokens = [...tokens, ...tokenBalances];
      }

      // Process NFTs data with the conversion function
      const nfts = (nftsResult.nfts.result || []).map(nft => 
        convertToMoralisNFT(nft, chainId, chainName)
      );

      // Process transactions data
      const transactions = (transactionsResult.transactions?.result || []).map((tx) => ({
        ...tx,
        chain: chainId,
        chainName
      })) as MoralisTransaction[];

      // Process token transfers
      const tokenTransfers = (transactionsResult.tokenTransfers?.result || []).map((transfer) => ({
        ...transfer,
        chain: chainId,
        chainName
      })) as MoralisTokenTransfer[];

      // Update chain data with fetched results
      setChainData(prev => {
        const updatedChainData = { ...prev };
        updatedChainData[chainId] = {
          tokens,
          nfts,
          transactions,
          tokenTransfers,
          isLoading: false
        };
        return updatedChainData;
      });
    } catch (err) {
      console.error(`Error fetching data for chain ${chainId}:`, err);
      // Update chain data with error state but keep any existing data
      setChainData(prev => {
        const updatedChainData = { ...prev };
        updatedChainData[chainId] = {
          ...prev[chainId],
          isLoading: false
        };
        return updatedChainData;
      });
      // Only set global error if this is the first/only error
      if (!error) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch data for chain ${chainId}`));
      }
    } finally {
      isFetchingRef.current[chainId] = false;
    }
  }, [getChainName, error, convertToMoralisNFT]);

  // Fetch data for all chains
  const fetchAllChainData = useCallback(async (walletAddress: string, chainIds: string[]) => {
    if (!walletAddress || !chainIds.length) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Initialize fetching flags for each chain
    for (const chainId of chainIds) {
      isFetchingRef.current[chainId] = false;
    }
    
    // Fetch data for all chains in parallel
    await Promise.all(
      chainIds.map(chainId => fetchChainData(walletAddress, chainId))
    );
    
    setIsLoading(false);
  }, [fetchChainData]);
  
  // Function to manually refetch data for specific chains or all chains
  const refetch = useCallback(async (specificChains?: string[]) => {
    if (!address) return;
    
    const chainsToFetch = specificChains || chainsRef.current;
    await fetchAllChainData(address, chainsToFetch);
  }, [address, fetchAllChainData]);

  // Effect to load data when address or chains change
  useEffect(() => {
    // Skip if neither address nor chains has changed
    if (
      addressRef.current === address && 
      isConnectedRef.current === isConnected && 
      JSON.stringify(chainsRef.current) === JSON.stringify(chains)
    ) {
      return;
    }
    
    // Update refs to prevent unnecessary re-renders
    addressRef.current = address;
    isConnectedRef.current = isConnected;
    chainsRef.current = chains;
    
    // Reset if not connected or no address
    if (!isConnected || !address || !enabled) {
      setIsLoading(false);
      return;
    }
    
    fetchAllChainData(address, chains);
    
    // Setup refresh interval if specified
    let intervalId: NodeJS.Timeout | undefined;
    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchAllChainData(address, chains);
      }, refreshInterval);
    }
    
    // Cleanup function
    return () => {
      // Clear interval if it exists
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      // Reset fetching flags
      isFetchingRef.current = {};
    };
  }, [address, isConnected, chains, enabled, refreshInterval, fetchAllChainData]);

  // Compute derived data from all chains
  const allTokens = Object.values(chainData)
    .flatMap(data => data.tokens)
    .filter(token => token !== null && token !== undefined);

  const allNfts = Object.values(chainData)
    .flatMap(data => data.nfts)
    .filter(nft => nft !== null && nft !== undefined);

  const allTransactions = Object.values(chainData)
    .flatMap(data => data.transactions)
    .filter(tx => tx !== null && tx !== undefined)
    .sort((a, b) => new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime());

  const allTokenTransfers = Object.values(chainData)
    .flatMap(data => data.tokenTransfers)
    .filter(transfer => transfer !== null && transfer !== undefined)
    .sort((a, b) => new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime());

  // Calculate total balance in USD (if price data is available)
  const totalBalanceUsd = allTokens.reduce((total, token) => {
    if (token.usdPrice && token.tokenValue) {
      return total + token.tokenValue;
    }
    return total;
  }, 0);

  /**
   * Get token logos for a list of token addresses
   * @param tokenAddresses Array of token addresses
   * @param chainId The blockchain chain ID (default: Ethereum)
   * @returns Object mapping token addresses to logo URLs
   */
  const getTokenLogos = async (tokenAddresses: string[], chainId = '0x1') => {
    if (tokenAddresses?.length === 0) return {};
    
    try {
      // Filter out any duplicate or invalid addresses
      const uniqueAddresses = [...new Set(tokenAddresses)].filter(address => 
        address && address.startsWith('0x') && address.length === 42
      );
      
      if (uniqueAddresses.length === 0) return {};
      
      // Create a mapping of address to logo URL
      const logoMapping: Record<string, string> = {};
      
      // Process each token address individually since getTokenMetadata only accepts one address
      for (const address of uniqueAddresses) {
        try {
          const metadata = await getTokenMetadata(address, chainId);
          if (metadata?.[0]?.address && metadata?.[0]?.logo) {
            logoMapping[metadata[0].address.toLowerCase()] = metadata[0].logo;
          }
        } catch (err) {
          console.warn(`Failed to get metadata for token ${address}:`, err);
        }
      }
      
      return logoMapping;
    } catch (error) {
      console.error('Error fetching token logos:', error);
      return {};
    }
  };

  /**
   * Get wallet portfolio value history
   * @param address The wallet address to query
   * @param days Number of days of history to retrieve (default: 30)
   * @param chainId The blockchain chain ID (default: Ethereum)
   * @returns Historical portfolio value data
   */
  const getPortfolioHistory = async (
    address?: string,
    days = 30,
    chainId = '0x1'
  ): Promise<PortfolioHistoryData | null> => {
    if (!address) return null;

    try {
      return await getPortfolioDataFromService(address, chainId, Number.parseInt(days?.toString() || "30"));
    } catch (error) {
      console.error("Failed to get portfolio history:", error);
      return null;
    }
  };

  return {
    byChain: chainData,
    allTokens,
    allNfts,
    allTransactions,
    allTokenTransfers,
    totalBalanceUsd,
    isLoading,
    error,
    refetch,
    getTokenLogos,
    getPortfolioHistory,
  };
} 