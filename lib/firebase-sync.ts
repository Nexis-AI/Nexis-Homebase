import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  Timestamp, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase-client';
import { moralisClient } from './moralis-client';

/**
 * Options for syncing wallet data to Firebase
 */
export interface SyncOptions {
  /**
   * Force refresh from Moralis even if cached data is valid
   */
  force?: boolean;
  
  /**
   * Include NFTs (can be resource-intensive)
   */
  includeNFTs?: boolean;
  
  /**
   * Include transaction history
   */
  includeHistory?: boolean;
  
  /**
   * Cache time-to-live in milliseconds
   */
  ttl?: number;
}

export const DEFAULT_SYNC_OPTIONS: SyncOptions = {
  force: false,
  includeNFTs: false,
  includeHistory: true,
  ttl: 30 * 60 * 1000, // 30 minutes
};

/**
 * Fetches wallet data from Moralis and stores it in Firebase
 * 
 * @param address Wallet address
 * @param chainId Blockchain chain ID
 * @param syncOptions Options for synchronization
 * @returns Object containing the synchronized data and success status
 */
export async function syncWalletDataToFirebase(
  address: string, 
  chainId: string = '0x1',
  syncOptions: SyncOptions = {}
) {
  // Merge options with defaults
  const options = { ...DEFAULT_SYNC_OPTIONS, ...syncOptions };
  
  try {
    const normalizedAddress = address.toLowerCase();
    const userDocRef = doc(db, 'users', normalizedAddress);
    
    // Check if cached data exists and is still valid
    let shouldFetchFresh = options.force;
    
    if (!shouldFetchFresh) {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastUpdated = userData.lastUpdated?.toDate() || 0;
        const now = new Date();
        const cacheAge = now.getTime() - (lastUpdated instanceof Date ? lastUpdated.getTime() : 0);
        
        // Check if cache is expired
        shouldFetchFresh = cacheAge > (options.ttl || 30 * 60 * 1000);
      } else {
        // No cache exists
        shouldFetchFresh = true;
      }
    }
    
    // Return cached data if it's still valid and force isn't true
    if (!shouldFetchFresh) {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return {
          success: true,
          fromCache: true,
          data: userDoc.data()
        };
      }
    }
    
    // Fetch fresh data from Moralis
    const moralis = moralisClient();
    
    // Fetch token balances
    const tokenBalancesPromise = moralis.getTokenBalances(address, chainId);
    
    // Fetch transactions
    const transactionsPromise = options.includeHistory 
      ? moralis.getTransactions(address, chainId)
      : Promise.resolve([]);
    
    // Fetch NFTs if requested
    const nftsPromise = options.includeNFTs 
      ? moralis.getNFTs(address, chainId)
      : Promise.resolve([]);
    
    // Fetch token approvals
    const tokenApprovalsPromise = moralis.getTokenApprovals(address, chainId);
    
    // Fetch portfolio history if requested
    const portfolioHistoryPromise = options.includeHistory
      ? moralis.getPortfolioHistory(address, chainId)
      : Promise.resolve([]);
    
    // Wait for all promises to resolve
    const [
      tokenBalances,
      transactions,
      nfts,
      tokenApprovals,
      portfolioHistory
    ] = await Promise.all([
      tokenBalancesPromise,
      transactionsPromise,
      nftsPromise,
      tokenApprovalsPromise,
      portfolioHistoryPromise
    ]);
    
    // Create the data object to save to Firebase
    const data = {
      address: normalizedAddress,
      chainId,
      tokenBalances,
      transactions,
      nfts,
      tokenApprovals,
      portfolioHistory,
      lastUpdated: serverTimestamp(),
    };
    
    // Save to Firebase
    await setDoc(userDocRef, data, { merge: true });
    
    return {
      success: true,
      fromCache: false,
      data
    };
  } catch (error) {
    console.error('Error syncing wallet data to Firebase:', error);
    return {
      success: false,
      fromCache: false,
      error
    };
  }
}

/**
 * Updates a specific collection of wallet data in Firebase
 * 
 * @param address Wallet address
 * @param chainId Blockchain chain ID
 * @param collection The collection/data type to update
 * @param force Force refresh from Moralis even if cached data is valid
 * @returns Object containing the updated data and success status
 */
export async function updateWalletDataCollection(
  address: string,
  chainId: string = '0x1',
  collection: 'tokenBalances' | 'nfts' | 'transactions' | 'tokenApprovals' | 'portfolioHistory',
  force: boolean = false
) {
  try {
    const normalizedAddress = address.toLowerCase();
    const userDocRef = doc(db, 'users', normalizedAddress);
    
    // Fetch the specified data from Moralis
    const moralis = moralisClient();
    let data;
    
    switch (collection) {
      case 'tokenBalances':
        data = await moralis.getTokenBalances(address, chainId);
        break;
      case 'nfts':
        data = await moralis.getNFTs(address, chainId);
        break;
      case 'transactions':
        data = await moralis.getTransactions(address, chainId);
        break;
      case 'tokenApprovals':
        data = await moralis.getTokenApprovals(address, chainId);
        break;
      case 'portfolioHistory':
        data = await moralis.getPortfolioHistory(address, chainId);
        break;
      default:
        throw new Error(`Unknown collection: ${collection}`);
    }
    
    // Save to Firebase
    await setDoc(userDocRef, {
      [collection]: data,
      lastUpdated: serverTimestamp(),
    }, { merge: true });
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error(`Error updating ${collection} for wallet:`, error);
    return {
      success: false,
      error
    };
  }
} 