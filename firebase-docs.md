# Firebase Integration Documentation

## Overview

This document outlines how Firebase services are integrated within the Nexis Dashboard application, specifically focusing on Firestore database usage for NFT metadata caching and webhook data storage.

## Firebase Services Used

The application utilizes the following Firebase services:

1. **Firestore Database**: Primary data storage for caching NFT metadata and storing webhook events
2. **Firebase Authentication**: (Configured but not documented in this file)
3. **Firebase Storage**: (Configured but not documented in this file)
4. **Firebase Analytics**: (Configured but not documented in this file)

## Firebase Configuration

Firebase is initialized in `lib/firebase.ts`:

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export Firestore database
export const db = getFirestore(app);
```

## Firestore Data Models

### NFT Metadata Cache

**Collection**: `nftMetadataCache`
**Document ID**: `{chain}:{address}` (e.g., `0x1:0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d`)

**Fields**:
- `metadata`: Object - NFT contract metadata
- `timestamp`: Number - Cache timestamp (epoch in ms)
- `chain`: String - Blockchain chain ID
- `address`: String - Contract address

**Purpose**: Persistent cache for NFT contract metadata to reduce Moralis API calls and improve performance.

### NFT Webhooks

**Collection**: `nftWebhooks`
**Document ID**: `{chain}:{address}:{timestamp}` (e.g., `0x1:0x1234...abcd:1697234567890`)

**Fields**:
- `chain`: String - Blockchain chain ID
- `address`: String - Wallet address (lowercase)
- `collections`: Array - Collection data from webhook
- `timestamp`: Number - Webhook receipt timestamp
- `streamId`: String - Moralis stream ID
- `raw`: Object - Complete webhook payload

**Purpose**: Store real-time NFT ownership changes from Moralis webhooks for faster data access.

## Integration Points

### 1. NFT Collections API Endpoint

**File**: `app/api/moralis/nft-collections/route.ts`

#### Metadata Caching

The application implements a dual-layer caching strategy:

1. **In-memory Cache**:
   - First-level cache with 5-minute expiration
   - Fastest response time, but doesn't persist between server restarts

2. **Firestore Persistent Cache**:
   - Second-level cache with 30-minute expiration (6x longer than in-memory)
   - Persists between server restarts
   - Used when in-memory cache misses

```typescript
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
```

#### Webhook Data Usage

Before making Moralis API calls, the endpoint checks for recent webhook data:

```typescript
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
```

#### Webhook Endpoint

The same file implements a webhook receiver endpoint that stores incoming webhook data to Firestore:

```typescript
export async function POST(request: Request) {
  // Verification logic...
  
  // Save the webhook data to Firestore
  if (data.confirmed && data.chainId && data.address) {
    const chain = `0x${Number.parseInt(data.chainId, 10).toString(16)}`;
    const address = data.address.toLowerCase();
    
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
}
```

## Performance Considerations

1. **Query Optimization**:
   - Firestore queries use compound conditions (address + chain + time-based filtering)
   - Indexes are required for these queries to perform efficiently

2. **Data Lifecycle**:
   - Implement a TTL (Time-To-Live) strategy for webhook data
   - Consider implementing a cleanup function to remove old cache entries

3. **Batch Operations**:
   - For bulk updates, use Firestore batch operations instead of multiple individual writes

## Moralis Webhook Setup

To utilize the webhook functionality:

1. Create a Moralis Stream via the Moralis admin dashboard
2. Configure it to monitor wallet NFT activities 
3. Set the webhook URL to your API endpoint: `/api/moralis/nft-collections`
4. (Optional) Set up signature verification for production environments

## Error Handling

The application implements graceful degradation:
- If Firestore operations fail, the application falls back to API calls
- All Firestore operations have try/catch blocks to prevent crashing the application

## Future Improvements

1. **Authentication Integration**:
   - Integrate Firebase Authentication with wallet authentication
   - Implement access controls for user-specific data

2. **Data Consistency**:
   - Implement database triggers for automatic cache invalidation
   - Consider using Firebase Functions for background processing

3. **Monitoring**:
   - Add Firebase Performance Monitoring to track database operations
   - Implement logging for cache hit/miss rates
