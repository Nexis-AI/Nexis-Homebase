import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { fetchTokenBalances, fetchNFTs, fetchTransactions } from './moralis-client';
import { getTokenMarketData, getPortfolioHistory } from './ankr-config';
import debounce from 'lodash.debounce';

// Cache expiration durations
const CACHE_DURATIONS = {
  PORTFOLIO: 5 * 60 * 1000, // 5 minutes
  TRANSACTIONS: 10 * 60 * 1000, // 10 minutes
  NFTS: 30 * 60 * 1000, // 30 minutes
  TOKEN_PRICES: 2 * 60 * 1000, // 2 minutes
  HISTORICAL_DATA: 60 * 60 * 1000, // 1 hour
};

interface CachedData<T> {
  timestamp: number;
  data: T;
}

// Generic cache checker
function isCacheValid<T>(cachedData: CachedData<T> | null, duration: number): boolean {
  if (!cachedData) return false;
  const now = Date.now();
  return now - cachedData.timestamp < duration;
}

// Firebase cache functions
async function getFromCache<T>(address: string, cacheKey: string): Promise<CachedData<T> | null> {
  try {
    if (!address) return null;
    
    const docRef = doc(db, 'users', address, 'cache', cacheKey);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as CachedData<T>;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting ${cacheKey} from cache:`, error);
    return null;
  }
}

const saveToCache = debounce(async function<T>(address: string, cacheKey: string, data: T): Promise<void> {
  try {
    if (!address) return;
    
    const cachedData: CachedData<T> = {
      timestamp: Date.now(),
      data
    };
    
    const docRef = doc(db, 'users', address, 'cache', cacheKey);
    await setDoc(docRef, cachedData);
  } catch (error) {
    console.error(`Error saving ${cacheKey} to cache:`, error);
  }
}, 500);

// Portfolio data services
export async function getPortfolioData(address: string, chain: string = 'eth') {
  // Try to get from cache first
  const cacheKey = `portfolio_${chain}`;
  const cachedData = await getFromCache(address, cacheKey);
  
  if (isCacheValid(cachedData, CACHE_DURATIONS.PORTFOLIO)) {
    return cachedData.data;
  }
  
  // Fetch fresh data
  try {
    // Fetch token balances using Moralis API
    const balances = await fetchTokenBalances(address, chain);
    
    // For each token, fetch additional market data using Ankr API
    const tokensWithMarketData = await Promise.all(
      balances.map(async (token) => {
        try {
          const marketData = await getTokenMarketData(token.token_address);
          return {
            ...token,
            marketData
          };
        } catch (err) {
          // Return the token without market data if there's an error
          return token;
        }
      })
    );
    
    // Calculate portfolio value and metrics
    const portfolioValue = tokensWithMarketData.reduce((sum, token) => {
      const price = token.marketData?.price || 0;
      const balance = parseFloat(token.balance) / Math.pow(10, parseInt(token.decimals));
      return sum + (balance * price);
    }, 0);
    
    const portfolioData = {
      tokens: tokensWithMarketData,
      totalValue: portfolioValue,
      lastUpdated: Date.now()
    };
    
    // Cache the data
    await saveToCache(address, cacheKey, portfolioData);
    
    return portfolioData;
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    
    // Return cached data even if it's expired as a fallback
    if (cachedData) {
      return cachedData.data;
    }
    
    throw error;
  }
}

// Get portfolio historical data with appropriate time intervals
export async function getPortfolioHistoricalData(address: string, timeframe = '30d') {
  const cacheKey = `portfolio_history_${timeframe}`;
  const cachedData = await getFromCache(address, cacheKey);
  
  if (isCacheValid(cachedData, CACHE_DURATIONS.HISTORICAL_DATA)) {
    return cachedData.data;
  }
  
  try {
    const historyData = await getPortfolioHistory(address, timeframe);
    
    // Format data for TradingView chart
    const formattedData = historyData.map(item => ({
      time: new Date(item.timestamp).getTime() / 1000,
      value: item.value
    }));
    
    await saveToCache(address, cacheKey, formattedData);
    
    return formattedData;
  } catch (error) {
    console.error('Error fetching portfolio history:', error);
    
    if (cachedData) {
      return cachedData.data;
    }
    
    throw error;
  }
}

// Get transactions with caching
export async function getTransactionHistory(address: string, chain: string = 'eth') {
  const cacheKey = `transactions_${chain}`;
  const cachedData = await getFromCache(address, cacheKey);
  
  if (isCacheValid(cachedData, CACHE_DURATIONS.TRANSACTIONS)) {
    return cachedData.data;
  }
  
  try {
    const transactions = await fetchTransactions(address, chain);
    await saveToCache(address, cacheKey, transactions);
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    
    if (cachedData) {
      return cachedData.data;
    }
    
    throw error;
  }
}

// Get NFTs with caching
export async function getNFTsWithCache(address: string, chain: string = 'eth') {
  const cacheKey = `nfts_${chain}`;
  const cachedData = await getFromCache(address, cacheKey);
  
  if (isCacheValid(cachedData, CACHE_DURATIONS.NFTS)) {
    return cachedData.data;
  }
  
  try {
    const nfts = await fetchNFTs(address, chain);
    await saveToCache(address, cacheKey, nfts);
    return nfts;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    
    if (cachedData) {
      return cachedData.data;
    }
    
    throw error;
  }
} 