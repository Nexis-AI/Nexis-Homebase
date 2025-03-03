import { 
  doc, 
  setDoc, 
  Timestamp, 
  arrayUnion, 
  collection,
  updateDoc,
  query,
  where,
  getDocs,
  addDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase-client';

/**
 * Handles a transaction stream from Moralis and updates Firestore
 * @param tx The transaction data from Moralis Stream
 * @param chainId The blockchain chain ID
 */
export async function handleTransactionStream(tx: Record<string, any>, chainId: string) {
  try {
    // Normalize addresses to lowercase
    const fromAddress = tx.fromAddress?.toLowerCase();
    const toAddress = tx.toAddress?.toLowerCase();
    
    if (!fromAddress && !toAddress) {
      console.error('Transaction missing both from and to addresses');
      return;
    }
    
    // Create transaction object
    const transaction = {
      hash: tx.hash,
      fromAddress,
      toAddress,
      value: tx.value,
      gasPrice: tx.gasPrice,
      gasUsed: tx.gasUsed,
      blockNumber: tx.blockNumber,
      blockTimestamp: tx.blockTimestamp,
      input: tx.input,
      methodId: tx.methodId,
      methodName: tx.methodName,
      chainId,
      createdAt: Timestamp.now(),
    };
    
    // Store the transaction in the transactions collection
    const txDocRef = doc(db, 'transactions', tx.hash);
    await setDoc(txDocRef, transaction);
    
    // Update the sender's recent transactions
    if (fromAddress) {
      const senderDocRef = doc(db, 'users', fromAddress);
      await updateDoc(senderDocRef, {
        recentTransactions: arrayUnion({ 
          hash: tx.hash,
          timestamp: tx.blockTimestamp,
          type: 'outgoing'
        }),
        lastTransactionAt: Timestamp.now()
      });
    }
    
    // Update the receiver's recent transactions
    if (toAddress) {
      const receiverDocRef = doc(db, 'users', toAddress);
      await updateDoc(receiverDocRef, {
        recentTransactions: arrayUnion({ 
          hash: tx.hash,
          timestamp: tx.blockTimestamp,
          type: 'incoming'
        }),
        lastTransactionAt: Timestamp.now()
      });
    }
    
    console.log(`Transaction ${tx.hash} processed and stored in Firestore`);
  } catch (error) {
    console.error('Error handling transaction stream:', error);
  }
}

/**
 * Handles a token transfer stream from Moralis and updates Firestore
 * @param transfer The token transfer data from Moralis Stream
 * @param chainId The blockchain chain ID
 */
export async function handleTokenTransferStream(transfer: Record<string, any>, chainId: string) {
  try {
    // Normalize addresses
    const fromAddress = transfer.fromAddress?.toLowerCase();
    const toAddress = transfer.toAddress?.toLowerCase();
    
    if (!fromAddress && !toAddress) {
      console.error('Token transfer missing both from and to addresses');
      return;
    }
    
    // Create a unique ID for this transfer
    const transferId = `${transfer.transactionHash}_${transfer.tokenAddress}_${transfer.value}`;
    
    // Create token transfer object
    const tokenTransfer = {
      hash: transfer.transactionHash,
      fromAddress,
      toAddress,
      tokenAddress: transfer.tokenAddress?.toLowerCase(),
      tokenName: transfer.tokenName,
      tokenSymbol: transfer.tokenSymbol,
      tokenDecimals: transfer.tokenDecimals,
      value: transfer.value,
      valueWithDecimals: transfer.valueWithDecimals,
      blockNumber: transfer.blockNumber,
      blockTimestamp: transfer.blockTimestamp,
      chainId,
      processed: true,
      createdAt: Timestamp.now(),
    };
    
    // Store the transfer in main transfers collection
    const transferDocRef = doc(db, 'tokenTransfers', transferId);
    await setDoc(transferDocRef, tokenTransfer);
    
    // Update the sender's token transfers (add to collection of transfers)
    if (fromAddress) {
      // Add to user's transfers collection
      const senderTransferRef = doc(db, 'users', fromAddress, 'tokenTransfers', transferId);
      await setDoc(senderTransferRef, tokenTransfer);
      
      // Update the user's document with most recent transfer
      const senderDocRef = doc(db, 'users', fromAddress);
      await updateDoc(senderDocRef, {
        lastTokenTransfer: {
          hash: transfer.transactionHash,
          tokenSymbol: transfer.tokenSymbol,
          value: transfer.valueWithDecimals,
          timestamp: transfer.blockTimestamp,
          type: 'outgoing'
        },
        lastUpdatedAt: Timestamp.now()
      });
      
      // Invalidate cached balances for this user to force refresh
      invalidateUserCache(fromAddress, chainId);
    }
    
    // Update the receiver's token transfers
    if (toAddress) {
      // Add to user's transfers collection
      const receiverTransferRef = doc(db, 'users', toAddress, 'tokenTransfers', transferId);
      await setDoc(receiverTransferRef, tokenTransfer);
      
      // Update the user's document with most recent transfer
      const receiverDocRef = doc(db, 'users', toAddress);
      await updateDoc(receiverDocRef, {
        lastTokenTransfer: {
          hash: transfer.transactionHash,
          tokenSymbol: transfer.tokenSymbol,
          value: transfer.valueWithDecimals,
          timestamp: transfer.blockTimestamp,
          type: 'incoming'
        },
        lastUpdatedAt: Timestamp.now()
      });
      
      // Invalidate cached balances for this user to force refresh
      invalidateUserCache(toAddress, chainId);
    }
    
    console.log(`Token transfer ${transferId} processed and stored in Firestore`);
  } catch (error) {
    console.error('Error handling token transfer stream:', error);
  }
}

/**
 * Helper function to invalidate a user's cache when new transactions come in
 * This forces a refresh of data on next query
 */
async function invalidateUserCache(address: string, chainId: string) {
  if (!address || !db) return;
  
  try {
    // Get all cache documents for this user
    const cacheQuery = query(
      collection(db, 'users', address, 'cache'),
      where('chainId', '==', chainId)
    );
    
    const cacheSnapshot = await getDocs(cacheQuery);
    
    // Delete or mark each cache entry as invalid
    const batch = writeBatch(db);
    cacheSnapshot.forEach((doc) => {
      // Option 1: Delete the cache
      // batch.delete(doc.ref);
      
      // Option 2: Mark as invalid but keep for debugging
      batch.update(doc.ref, { 
        isValid: false,
        invalidatedAt: Timestamp.now(),
        reason: 'New transaction detected'
      });
    });
    
    await batch.commit();
    console.log(`Cache invalidated for user ${address} on chain ${chainId}`);
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}

/**
 * Handles an NFT transfer stream from Moralis and updates Firestore
 * @param transfer The NFT transfer data from Moralis Stream
 * @param chainId The blockchain chain ID
 */
export async function handleNFTTransferStream(transfer: Record<string, any>, chainId: string) {
  try {
    // Normalize addresses to lowercase
    const fromAddress = transfer.from?.toLowerCase();
    const toAddress = transfer.to?.toLowerCase();
    
    if (!fromAddress && !toAddress) {
      console.error('NFT transfer missing both from and to addresses');
      return;
    }
    
    // Create NFT transfer object
    const nftTransfer = {
      transactionHash: transfer.transactionHash,
      address: transfer.address?.toLowerCase(), // NFT contract
      fromAddress,
      toAddress,
      tokenId: transfer.tokenId,
      amount: transfer.amount || "1",
      tokenContractType: transfer.tokenContractType,
      tokenName: transfer.tokenName,
      tokenSymbol: transfer.tokenSymbol,
      blockNumber: transfer.blockNumber,
      blockTimestamp: transfer.blockTimestamp,
      chainId,
      createdAt: Timestamp.now(),
    };
    
    // Store in nftTransfers collection
    const transferId = `${transfer.transactionHash}-${transfer.logIndex}`;
    const transferDocRef = doc(db, 'nftTransfers', transferId);
    await setDoc(transferDocRef, nftTransfer);
    
    // Update the sender's NFT transfers
    if (fromAddress) {
      const senderDocRef = doc(db, 'users', fromAddress);
      await updateDoc(senderDocRef, {
        lastNFTTransfer: {
          hash: transfer.transactionHash,
          tokenName: transfer.tokenName,
          tokenId: transfer.tokenId,
          timestamp: transfer.blockTimestamp,
          type: 'outgoing'
        },
        lastUpdatedAt: Timestamp.now()
      });
    }
    
    // Update the receiver's NFT transfers
    if (toAddress) {
      const receiverDocRef = doc(db, 'users', toAddress);
      await updateDoc(receiverDocRef, {
        lastNFTTransfer: {
          hash: transfer.transactionHash,
          tokenName: transfer.tokenName,
          tokenId: transfer.tokenId,
          timestamp: transfer.blockTimestamp,
          type: 'incoming'
        },
        lastUpdatedAt: Timestamp.now()
      });
    }
    
    console.log(`NFT transfer ${transferId} processed and stored in Firestore`);
  } catch (error) {
    console.error('Error handling NFT transfer stream:', error);
  }
}

/**
 * Registers a wallet address to be monitored by Moralis Streams
 * Note: In a real implementation, this would call the Moralis API to register the stream
 * 
 * @param address The wallet address to monitor
 * @param chainId The blockchain chain ID
 * @param options Options for what to monitor (transactions, tokens, NFTs)
 */
export async function registerWalletForStreams(
  address: string,
  chainId: string = '0x1',
  options = { transactions: true, tokens: true, nfts: true }
) {
  const normalizedAddress = address.toLowerCase();
  
  try {
    // Store the registration in Firestore
    // This is just for demonstration - in a real implementation,
    // you would call the Moralis Streams API to register the stream
    await addDoc(collection(db, 'streamRegistrations'), {
      address: normalizedAddress,
      chainId,
      options,
      createdAt: Timestamp.now(),
      status: 'registered'
    });
    
    console.log(`Wallet ${normalizedAddress} registered for Moralis Streams monitoring`);
    return {
      success: true,
      address: normalizedAddress,
      chainId
    };
  } catch (error) {
    console.error('Error registering wallet for streams:', error);
    return {
      success: false,
      error
    };
  }
} 