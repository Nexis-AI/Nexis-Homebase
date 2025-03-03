import { type NextRequest, NextResponse } from 'next/server';
import { 
  handleTransactionStream, 
  handleTokenTransferStream, 
  handleNFTTransferStream 
} from '@/lib/moralis-streams';

/**
 * Validate that the webhook request is coming from Moralis
 * In production, implement proper signature verification
 */
function validateMoralisWebhook(request: NextRequest): boolean {
  // In production, verify the webhook signature with Moralis
  // using the x-signature header and your API secret
  // For simplicity, we're returning true in this example
  return true;
}

/**
 * POST handler for Moralis Streams webhook
 * This endpoint receives events from Moralis Streams and processes them
 */
export async function POST(request: NextRequest) {
  try {
    // Validate the webhook
    if (!validateMoralisWebhook(request)) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }
    
    // Parse the webhook body
    const body = await request.json();
    
    // Extract data from the webhook
    const { 
      confirmed, 
      chainId, 
      streamId,
      txs = [], 
      erc20Transfers = [], 
      nftTransfers = [] 
    } = body;
    
    // Only process confirmed transactions for safety
    // Each blockchain has its own confirmation threshold
    if (confirmed) {
      console.log(`Processing confirmed webhook event from stream ${streamId} on chain ${chainId}`);
      
      // Process transactions
      let processedTxs = 0;
      for (const tx of txs) {
        await handleTransactionStream(tx, chainId);
        processedTxs++;
      }
      
      // Process ERC20 token transfers
      let processedTokenTransfers = 0;
      for (const transfer of erc20Transfers) {
        await handleTokenTransferStream(transfer, chainId);
        processedTokenTransfers++;
      }
      
      // Process NFT transfers
      let processedNFTTransfers = 0;
      for (const transfer of nftTransfers) {
        await handleNFTTransferStream(transfer, chainId);
        processedNFTTransfers++;
      }
      
      console.log(`Processed ${processedTxs} transactions, ${processedTokenTransfers} token transfers, and ${processedNFTTransfers} NFT transfers`);
      
      // Return success response with counts
      return NextResponse.json({
        success: true,
        processed: {
          transactions: processedTxs,
          tokenTransfers: processedTokenTransfers,
          nftTransfers: processedNFTTransfers
        }
      });
    } else {
      // For unconfirmed transactions, you might want to store them separately
      // or just acknowledge receipt without processing
      return NextResponse.json({
        success: true,
        message: 'Unconfirmed event received, not processed'
      });
    }
  } catch (error) {
    console.error('Error processing Moralis webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 