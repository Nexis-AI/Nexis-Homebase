import Moralis from 'moralis';
import { getDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Use the Firebase setup from lib directory
import { initMoralis, withMoralis } from '@/lib/moralis-client';

// Fetch wallet token balances with price
export const getWalletTokenBalancesPrice = async (userAddress: string, chainId: string) => {
  try {
    // Initialize Moralis first
    await initMoralis();
    
    // Use withMoralis wrapper to ensure proper initialization
    const portfolio = await withMoralis(async () => {
      return await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
        address: userAddress,
        chain: chainId
      });
    });

    // Cache the response in Firestore
    await setDoc(doc(db, "users", userAddress, "walletData", "balances"), {
      data: portfolio,
      lastUpdated: serverTimestamp(),
      chain: chainId
    });

    return portfolio;
  } catch (error) {
    console.error("Moralis API error:", error);
    throw new Error("Failed to fetch wallet token balances");
  }
};

// Fetch wallet NFTs with normalized metadata
export const getWalletNFTs = async (userAddress: string, chainId: string) => {
  try {
    // Initialize Moralis first
    await initMoralis();
    
    // Use withMoralis wrapper to ensure proper initialization
    const nfts = await withMoralis(async () => {
      return await Moralis.EvmApi.nft.getWalletNFTs({
        address: userAddress,
        chain: chainId,
        limit: 100,
        normalizeMetadata: true
      });
    });

    return nfts;
  } catch (error) {
    console.error("Moralis API error:", error);
    throw new Error("Failed to fetch wallet NFTs");
  }
};

// ...existing code...
