import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  collection,
  getDocs,
  type Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import {
  type WalletCache,
  type TokenMetadata,
  type NFTMetadata,
  type PortfolioHistory,
  type UserWalletData,
  type TokenApproval,
  type ChainId,
  type TimestampFields,
  COLLECTION_PATHS
} from '@/lib/types/firebase';

// Validation helpers
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const isValidChainId = (chainId: string): boolean => {
  const validChainIds = ['0x1', '0x89', '0x38', '0xa4b1', '0x2105'];
  return validChainIds.includes(chainId);
};

// Cache management helpers
export const isCacheValid = (timestamp: number, maxAge: number): boolean => {
  return Date.now() - timestamp < maxAge;
};

// Document path helpers
export const getWalletCachePath = (address: string) => 
  `${COLLECTION_PATHS.WALLET_CACHE}/${address.toLowerCase()}`;

export const getTokenMetadataPath = (chainId: ChainId, address: string) => 
  `${COLLECTION_PATHS.TOKEN_METADATA}/${chainId}:${address.toLowerCase()}`;

export const getNFTMetadataPath = (chainId: ChainId, address: string, tokenId: string) => 
  `${COLLECTION_PATHS.NFT_METADATA}/${chainId}:${address.toLowerCase()}:${tokenId}`;

export const getPortfolioHistoryPath = (address: string, timestamp: number) => 
  `${COLLECTION_PATHS.PORTFOLIO_HISTORY}/${address.toLowerCase()}:${timestamp}`;

export const getUserWalletDataPath = (userId: string) => 
  `${COLLECTION_PATHS.USERS}/${userId}/${COLLECTION_PATHS.WALLET_DATA}`;

export const getTokenApprovalPath = (chainId: ChainId, tokenAddress: string, spenderAddress: string) => 
  `${COLLECTION_PATHS.TOKEN_APPROVALS}/${chainId}:${tokenAddress.toLowerCase()}:${spenderAddress.toLowerCase()}`;

// Wallet Cache Operations
export async function getWalletCache(address: string): Promise<WalletCache | null> {
  if (!isValidAddress(address)) throw new Error('Invalid wallet address');
  
  const docRef = doc(db, getWalletCachePath(address));
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return docSnap.data() as WalletCache;
}

export async function setWalletCache(
  address: string,
  data: Pick<WalletCache, 'nativeBalance' | 'tokens'>
): Promise<void> {
  if (!isValidAddress(address)) throw new Error('Invalid wallet address');
  
  const docRef = doc(db, getWalletCachePath(address));
  await setDoc(docRef, {
    ...data,
    address: address.toLowerCase(),
    lastUpdatedAt: serverTimestamp(),
  });
}

// Token Metadata Operations
export async function getTokenMetadata(chainId: ChainId, address: string): Promise<TokenMetadata | null> {
  if (!isValidChainId(chainId)) throw new Error('Invalid chain ID');
  if (!isValidAddress(address)) throw new Error('Invalid token address');
  
  const docRef = doc(db, getTokenMetadataPath(chainId, address));
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return docSnap.data() as TokenMetadata;
}

export async function setTokenMetadata(
  chainId: ChainId, 
  address: string, 
  metadata: TokenMetadata['metadata']
): Promise<void> {
  if (!isValidChainId(chainId)) throw new Error('Invalid chain ID');
  if (!isValidAddress(address)) throw new Error('Invalid token address');
  
  const docRef = doc(db, getTokenMetadataPath(chainId, address));
  await setDoc(docRef, {
    metadata,
    timestamp: Date.now(),
    updatedAt: serverTimestamp(),
  });
}

// Portfolio History Operations
export async function addPortfolioHistoryEntry(
  address: string,
  data: Omit<PortfolioHistory, keyof TimestampFields | 'timestamp'>
): Promise<void> {
  if (!isValidAddress(address)) throw new Error('Invalid wallet address');
  
  const timestamp = Date.now();
  const docRef = doc(db, getPortfolioHistoryPath(address, timestamp));
  await setDoc(docRef, {
    ...data,
    timestamp,
    createdAt: serverTimestamp(),
  });
}

export async function getPortfolioHistory(
  address: string,
  startTime: number,
  endTime: number = Date.now(),
  maxResults = 100
): Promise<PortfolioHistory[]> {
  if (!isValidAddress(address)) throw new Error('Invalid wallet address');
  
  const q = query(
    collection(db, COLLECTION_PATHS.PORTFOLIO_HISTORY),
    where('timestamp', '>=', startTime),
    where('timestamp', '<=', endTime),
    orderBy('timestamp', 'desc'),
    limit(maxResults)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as PortfolioHistory);
}

// User Wallet Data Operations
export async function getUserWalletData(userId: string): Promise<UserWalletData | null> {
  const docRef = doc(db, getUserWalletDataPath(userId));
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return docSnap.data() as UserWalletData;
}

export async function updateUserWalletData(
  userId: string,
  data: Partial<Omit<UserWalletData, keyof TimestampFields>>
): Promise<void> {
  const docRef = doc(db, getUserWalletDataPath(userId));
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Token Approval Operations
export async function getTokenApproval(
  chainId: ChainId,
  tokenAddress: string,
  spenderAddress: string
): Promise<TokenApproval | null> {
  if (!isValidChainId(chainId)) throw new Error('Invalid chain ID');
  if (!isValidAddress(tokenAddress)) throw new Error('Invalid token address');
  if (!isValidAddress(spenderAddress)) throw new Error('Invalid spender address');
  
  const docRef = doc(db, getTokenApprovalPath(chainId, tokenAddress, spenderAddress));
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return docSnap.data() as TokenApproval;
}

export async function setTokenApproval(
  chainId: ChainId,
  tokenAddress: string,
  spenderAddress: string,
  data: Omit<TokenApproval, keyof TimestampFields>
): Promise<void> {
  if (!isValidChainId(chainId)) throw new Error('Invalid chain ID');
  if (!isValidAddress(tokenAddress)) throw new Error('Invalid token address');
  if (!isValidAddress(spenderAddress)) throw new Error('Invalid spender address');
  
  const docRef = doc(db, getTokenApprovalPath(chainId, tokenAddress, spenderAddress));
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
    lastTransactionAt: serverTimestamp(),
  });
}

// Cache management
export const CACHE_DURATIONS = {
  WALLET_DATA: 5 * 60 * 1000,        // 5 minutes
  TOKEN_METADATA: 24 * 60 * 60 * 1000, // 24 hours
  NFT_METADATA: 24 * 60 * 60 * 1000,   // 24 hours
} as const; 