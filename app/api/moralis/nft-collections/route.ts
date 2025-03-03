import { NextResponse } from 'next/server';
import Moralis from 'moralis';
import { initMoralis, withMoralis } from '@/lib/moralis-client';
import { db } from '@/lib/firebase'; // Using the Firebase setup we created
import { collection, doc, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';

// Define interface for collection metadata to handle null checks
interface ContractMetadata {
  name?: string;
  symbol?: string;
  contract_type?: string;
  synced_at?: string;
  // Using unknown instead of any for better type safety
  [key: string]: unknown;
}

// Type guard function to check if metadata is not null
function isMetadataPresent(metadata: ContractMetadata | null): metadata is ContractMetadata {
  return metadata !== null;
}

// Simple in-memory cache with expiration (5 minutes)
const metadataCache: Record<string, { data: ContractMetadata; timestamp: number }> = {};
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

// Batch size for metadata requests to avoid rate limits
const METADATA_BATCH_SIZE = 10;

// Maximum number of retries for API calls
const MAX_RETRIES = 3;

/**
 * Retry function with exponential backoff
 * @param fn Function to retry
 * @param retries Maximum number of retries
 * @param baseDelay Base delay in ms
 * @param maxDelay Maximum delay in ms
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  baseDelay = 300,
  maxDelay = 10000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Don't retry if we're out of retries or if it's not a rate limit error
    if (
      retries <= 0 ||
      !(error instanceof Error && 
        (error.message.includes('rate limit') || 
         error.message.includes('too many requests') ||
         error.message.includes('timeout') ||
         error.message.includes('network')))
    ) {
      throw error;
    }

    // Calculate delay with jitter to prevent synchronized retries
    const delay = Math.min(maxDelay, baseDelay * (2 ** (MAX_RETRIES - retries)));
    const jitter = delay * 0.2 * Math.random(); // 20% jitter
    const finalDelay = delay + jitter;
    
    console.log(`Retrying after ${Math.round(finalDelay)}ms, ${retries} retries left`);
    
    // Wait for the calculated delay
    await new Promise(resolve => setTimeout(resolve, finalDelay));
    
    // Retry with one less retry remaining
    return retryWithBackoff(fn, retries - 1, baseDelay, maxDelay);
  }
}

/**
 * Persistent cache functions for metadata
 */
const persistentCache = {
  async get(chain: string, address: string): Promise<ContractMetadata | null> {
    try {
      const cacheRef = doc(db, 'nftMetadataCache', `${chain}:${address}`);
      const cacheDoc = await getDoc(cacheRef);
      
      if (cacheDoc.exists()) {
        const data = cacheDoc.data();
        // Check if cache has expired
        if (Date.now() - data.timestamp < CACHE_EXPIRY * 6) { // 30 minutes for persistent cache
          return data.metadata as ContractMetadata;
        }
      }
      return null;
    } catch (error) {
      console.error('Error reading from persistent cache:', error);
      return null;
    }
  },
  
  async set(chain: string, address: string, metadata: ContractMetadata): Promise<void> {
    try {
      const cacheRef = doc(db, 'nftMetadataCache', `${chain}:${address}`);
      await setDoc(cacheRef, {
        metadata,
        timestamp: Date.now(),
        chain,
        address
      });
    } catch (error) {
      console.error('Error writing to persistent cache:', error);
    }
  }
};

/**
 * GET NFT collections for a wallet from Moralis API
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const chain = searchParams.get('chain') || '0x1'; // Default to Ethereum mainnet if not provided
    const limit = searchParams.get('limit') ? Number.parseInt(searchParams.get('limit') as string, 10) : 100;
    const cursor = searchParams.get('cursor') || null;
    const skipCache = searchParams.get('skipCache') === 'true';
    
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Missing wallet address parameter' },
        { status: 400 }
      );
    }

    // Initialize Moralis via our wrapper
    await initMoralis();
    
    // Check if we have recent data from a webhook first
    // This pattern allows us to serve webhook data if available
    if (!skipCache) {
      try {
        const webhookQuery = query(
          collection(db, 'nftWebhooks'),
          where('address', '==', address.toLowerCase()),
          where('chain', '==', chain),
          where('timestamp', '>=', Date.now() - 5 * 60 * 1000) // Last 5 minutes
        );
        
        const webhookDocs = await getDocs(webhookQuery);
        if (!webhookDocs.empty) {
          const latestDoc = Array.from(webhookDocs.docs)
            .sort((a, b) => b.data().timestamp - a.data().timestamp)[0];
          
          const webhookData = latestDoc.data();
          if (webhookData.collections) {
            console.log('Using webhook data for', address);
            return NextResponse.json({
              success: true,
              collections: webhookData.collections,
              pagination: {
                total: webhookData.collections.length,
                cursor: null,
              },
              source: 'webhook'
            });
          }
        }
      } catch (error) {
        console.error('Error checking webhook data:', error);
        // Continue with API fetch on webhook error
      }
    }

    // Get NFTs owned by wallet with retry logic and Moralis wrapper
    const nftsData = await withMoralis(async () => {
      const nftsResponse = await retryWithBackoff(async () => {
        return await Moralis.EvmApi.nft.getWalletNFTs({
          address,
          chain: chain as string,
          limit,
          cursor: cursor || undefined,
          normalizeMetadata: true,
        });
      });
      
      return nftsResponse.toJSON();
    });
    
    // Group NFTs by collection to create a collection-centric view
    const collectionMap = new Map();
    
    for (const nft of nftsData.result) {
      const collectionAddress = nft.token_address;
      
      if (!collectionMap.has(collectionAddress)) {
        collectionMap.set(collectionAddress, {
          collectionAddress: collectionAddress,
          name: nft.name || 'Unknown Collection',
          symbol: nft.symbol || '',
          count: 0,
          items: [],
          floorPrice: null,
          totalValue: null,
        });
      }
      
      const collection = collectionMap.get(collectionAddress);
      collection.count += 1;
      collection.items.push({
        tokenId: nft.token_id,
        name: nft.name,
        symbol: nft.symbol,
        amount: nft.amount,
        metadata: nft.metadata,
        normalized_metadata: nft.normalized_metadata,
        image: nft.normalized_metadata?.image || '',
      });
    }
    
    // Fetch collection metadata for each collection
    const collections = Array.from(collectionMap.values());
    const collectionAddresses = Array.from(collectionMap.keys());
    
    if (collectionAddresses.length > 0) {
      try {
        // Process collection addresses in batches to avoid rate limits
        const collectionsMetadata = [];
        
        // Function to get metadata with caching (memory + persistent)
        const getMetadataWithCache = async (address: string) => {
          const cacheKey = `${chain}:${address}`;
          const now = Date.now();
          
          // Check memory cache first (unless skipCache is true)
          if (!skipCache && 
              metadataCache[cacheKey] && 
              now - metadataCache[cacheKey].timestamp < CACHE_EXPIRY) {
            return {
              address,
              metadata: metadataCache[cacheKey].data,
              fromCache: 'memory'
            };
          }
          
          // Check persistent cache
          if (!skipCache) {
            const persistentData = await persistentCache.get(chain, address);
            if (persistentData) {
              // Update memory cache too
              metadataCache[cacheKey] = {
                data: persistentData,
                timestamp: now
              };
              
              return {
                address,
                metadata: persistentData,
                fromCache: 'persistent'
              };
            }
          }
          
          // No cache hit, fetch from API with retry logic and Moralis wrapper
          try {
            const metadataJson = await withMoralis(async () => {
              const metadata = await retryWithBackoff(async () => {
                return await Moralis.EvmApi.nft.getNFTContractMetadata({
                  address,
                  chain: chain as string,
                });
              });
              
              return metadata?.toJSON() as ContractMetadata;
            });
            
            // Update both caches
            metadataCache[cacheKey] = {
              data: metadataJson,
              timestamp: now
            };
            
            // Update persistent cache asynchronously
            persistentCache.set(chain, address, metadataJson).catch(console.error);
            
            return {
              address,
              metadata: metadataJson,
              fromCache: false
            };
          } catch (error) {
            console.error(`Error fetching metadata for collection ${address}:`, error);
            return {
              address,
              metadata: null as ContractMetadata | null,
              fromCache: false
            };
          }
        };
        
        // Process in batches
        for (let i = 0; i < collectionAddresses.length; i += METADATA_BATCH_SIZE) {
          const batch = collectionAddresses.slice(i, i + METADATA_BATCH_SIZE);
          
          // Add a small delay between batches if not the first batch
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between batches
          }
          
          const batchResults = await Promise.all(
            batch.map(address => getMetadataWithCache(address))
          );
          
          collectionsMetadata.push(...batchResults);
        }
        
        // Merge the metadata into our collections
        for (const { address, metadata } of collectionsMetadata) {
          // Only process if metadata is not null and collection address exists in our map
          if (isMetadataPresent(metadata) && collectionMap.has(address)) {
            const collection = collectionMap.get(address);
            collection.name = metadata.name || collection.name;
            collection.symbol = metadata.symbol || collection.symbol;
            collection.tokenType = metadata.contract_type || '';
            collection.syncedAt = metadata.synced_at || '';
          }
        }
      } catch (error) {
        console.error('Error fetching collection metadata:', error);
        // Continue without collection metadata
      }
    }
    
    // Return the response
    return NextResponse.json({
      success: true,
      collections,
      pagination: {
        total: collections.length,
        cursor: nftsData.cursor || null,
      },
      source: 'api'
    });
  } catch (error) {
    // Check for rate limit errors
    if (error instanceof Error && 
        (error.message.includes('rate limit') || 
         error.message.includes('too many requests'))) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.',
          isRateLimited: true
        },
        { status: 429 }
      );
    }
    
    console.error('Error fetching NFT collections:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error fetching NFT collections' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for receiving Moralis webhooks
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Verify webhook signature (this would typically use Moralis SDK)
    // This is a simplified example - in production, use proper verification
    const moralisSignature = request.headers.get('x-signature');
    if (!moralisSignature) {
      return NextResponse.json(
        { success: false, error: 'Missing webhook signature' },
        { status: 401 }
      );
    }
    
    // For simplicity, we're skipping actual signature verification here
    // In production, you should verify using Moralis.Streams.verifySignature
    
    // Save the webhook data to Firestore for quick retrieval
    if (data.confirmed && data.chainId && data.address) {
      const chain = `0x${Number.parseInt(data.chainId, 10).toString(16)}`;
      const address = data.address.toLowerCase();
      
      // Process NFT collection data from webhook
      // This is a simplified example - in production, format properly
      const webhookRef = doc(db, 'nftWebhooks', `${chain}:${address}:${Date.now()}`);
      await setDoc(webhookRef, {
        chain,
        address,
        collections: data.collections || [],
        timestamp: Date.now(),
        streamId: data.streamId,
        raw: data
      });
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid webhook data' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return NextResponse.json(
      { success: false, error: 'Webhook processing error' },
      { status: 500 }
    );
  }
} 