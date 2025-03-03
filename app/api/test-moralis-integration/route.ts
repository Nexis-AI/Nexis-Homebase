import { NextResponse } from 'next/server';
import Moralis from 'moralis';
import { initMoralis, withMoralis } from '@/lib/moralis-client';

// Define proper types for the results object
interface TestResult<T> {
  success: boolean;
  error?: string;
  message?: string;
  data: T | null;
}

// Define type interfaces for Moralis API responses
interface NativeBalance {
  balance: string;
}

interface TokenBalance {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  possible_spam: boolean;
  verified_contract?: boolean;
}

interface NFTResponse {
  result: Array<{
    token_address: string;
    token_id: string;
    contract_type: string;
    owner_of: string;
    block_number: string;
    block_number_minted: string;
    token_uri?: string;
    metadata?: string;
    normalized_metadata?: Record<string, unknown>;
    [key: string]: unknown;
  }>;
  page?: number;
  page_size?: number;
  cursor?: string;
  [key: string]: unknown;
}

interface TransactionResponse {
  result: Array<{
    hash: string;
    nonce: string;
    transaction_index: string;
    from_address: string;
    to_address: string;
    value: string;
    [key: string]: unknown;
  }>;
  page?: number;
  page_size?: number;
  cursor?: string;
  [key: string]: unknown;
}

interface TokenPrice {
  tokenName?: string;
  tokenSymbol?: string;
  tokenLogo?: string;
  nativePrice?: {
    value: string;
    decimals: number;
    name: string;
    symbol: string;
    address: string;
  };
  usdPrice?: number;
  [key: string]: unknown;
}

interface TestResults {
  initialization: TestResult<null>;
  nativeBalance: TestResult<NativeBalance>;
  tokenBalances: TestResult<TokenBalance[]>;
  nfts: TestResult<NFTResponse>;
  transactions: TestResult<TransactionResponse>;
  tokenPrice: TestResult<TokenPrice>;
}

export async function GET(request: Request) {
  const results: TestResults = {
    initialization: { success: false, data: null },
    nativeBalance: { success: false, data: null },
    tokenBalances: { success: false, data: null },
    nfts: { success: false, data: null },
    transactions: { success: false, data: null },
    tokenPrice: { success: false, data: null }
  };

  try {
    // Test wallet address (Ethereum Foundation)
    const testAddress = '0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae';
    const chainId = '0x1'; // Ethereum Mainnet

    // Step 1: Initialize Moralis
    try {
      await initMoralis();
      results.initialization.success = true;
      results.initialization.message = 'Moralis initialized successfully';
    } catch (error: unknown) {
      const err = error as Error;
      results.initialization.success = false;
      results.initialization.message = 'Failed to initialize Moralis';
      results.initialization.error = err.message;
      return NextResponse.json(results);
    }

    // Step 2: Get native balance
    try {
      const nativeBalance = await withMoralis(async () => {
        return await Moralis.EvmApi.balance.getNativeBalance({
          address: testAddress,
          chain: chainId
        });
      });
      results.nativeBalance.success = true;
      results.nativeBalance.data = nativeBalance.toJSON() as NativeBalance;
    } catch (error: unknown) {
      const err = error as Error;
      results.nativeBalance.error = err.message;
    }

    // Step 3: Get token balances
    try {
      const tokenBalances = await withMoralis(async () => {
        return await Moralis.EvmApi.token.getWalletTokenBalances({
          address: testAddress,
          chain: chainId
        });
      });
      results.tokenBalances.success = true;
      results.tokenBalances.data = tokenBalances.toJSON() as TokenBalance[];
    } catch (error: unknown) {
      const err = error as Error;
      results.tokenBalances.error = err.message;
    }

    // Step 4: Get NFTs
    try {
      const nfts = await withMoralis(async () => {
        return await Moralis.EvmApi.nft.getWalletNFTs({
          address: testAddress,
          chain: chainId,
          limit: 5
        });
      });
      results.nfts.success = true;
      results.nfts.data = nfts.toJSON() as unknown as NFTResponse;
    } catch (error: unknown) {
      const err = error as Error;
      results.nfts.error = err.message;
    }

    // Step 5: Get transactions
    try {
      const transactions = await withMoralis(async () => {
        return await Moralis.EvmApi.transaction.getWalletTransactions({
          address: testAddress,
          chain: chainId,
          limit: 5
        });
      });
      results.transactions.success = true;
      results.transactions.data = transactions.toJSON() as unknown as TransactionResponse;
    } catch (error: unknown) {
      const err = error as Error;
      results.transactions.error = err.message;
    }

    // Step 6: Get token price (ETH)
    try {
      const tokenPrice = await withMoralis(async () => {
        return await Moralis.EvmApi.token.getTokenPrice({
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
          chain: chainId
        });
      });
      results.tokenPrice.success = true;
      results.tokenPrice.data = tokenPrice.toJSON() as TokenPrice;
    } catch (error: unknown) {
      const err = error as Error;
      results.tokenPrice.error = err.message;
    }

    // Return all test results
    return NextResponse.json({
      success: true,
      results,
      message: 'Moralis integration test completed'
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Moralis test error:', err);
    return NextResponse.json({
      success: false,
      error: err.message
    });
  }
} 