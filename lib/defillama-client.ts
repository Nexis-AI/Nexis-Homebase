// DefiLlama API client for fetching DeFi protocol data
// Documentation: https://defillama.com/docs/api

/**
 * Base URL for DefiLlama API
 */
const DEFILLAMA_API_BASE_URL = 'https://api.llama.fi';
const COINS_API_BASE_URL = 'https://coins.llama.fi';

/**
 * Type definitions for DefiLlama API responses
 */
export interface ProtocolData {
  name: string;
  address?: string;
  symbol: string;
  url: string;
  description: string;
  tvl: number;
  chain: string;
  chainTvls: Record<string, number>;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  mcap?: number;
  [key: string]: any;
}

export interface ChainTvlData {
  tvl: number;
  date: number;
  [key: string]: any;
}

export interface ChainsTvlData {
  [chainId: string]: {
    tvl: number;
    tokenSymbol: string;
    cmcId: number;
    gecko_id?: string;
    [key: string]: any;
  };
}

export interface TokenPrice {
  decimals: number;
  symbol: string;
  price: number;
  timestamp: number;
  confidence: number;
  [key: string]: any;
}

export interface TokenPricesResponse {
  coins: {
    [tokenAddress: string]: TokenPrice;
  };
}

export interface HistoricalTokenPriceResponse {
  coins: {
    [tokenAddress: string]: {
      prices: {
        timestamp: number;
        price: number;
      }[];
    };
  };
}

export interface TokenChartData {
  timestamp: number;
  price: number;
  [key: string]: any;
}

export interface StablecoinData {
  pegType: string;
  peggedAssets: Array<{
    name: string;
    symbol: string;
    address: string;
    circulating: number;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface YieldData {
  data: Array<{
    pool: string;
    project: string;
    chain: string;
    apy: number;
    tvlUsd: number;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface SearchTokensResponse {
  tokens: Array<{
    name: string;
    symbol: string;
    address: string;
    chain: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface PortfolioToken {
  name: string;
  symbol: string;
  address: string;
  chain: string;
  category: string;
  usdValue: number;
  balance: number;
  price: number;
  [key: string]: any;
}

export interface PortfolioResponse {
  portfolio: {
    totalUsd: number;
    tokens: PortfolioToken[];
    [key: string]: any;
  };
}

/**
 * Generic fetch function for DefiLlama API
 */
async function fetchDefiLlama<T>(endpoint: string, baseUrl = DEFILLAMA_API_BASE_URL): Promise<T> {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`DefiLlama API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`Error fetching from DefiLlama API (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Get protocol data by name (e.g., "aave")
 */
export async function getProtocolData(protocolName: string): Promise<ProtocolData> {
  return fetchDefiLlama<ProtocolData>(`/protocol/${protocolName}`);
}

/**
 * Get TVL for a specific chain
 */
export async function getChainTvl(chain: string): Promise<ChainTvlData[]> {
  return fetchDefiLlama<ChainTvlData[]>(`/v2/historicalChainTvl/${chain}`);
}

/**
 * Get current TVL for all chains
 */
export async function getAllChainsTvl(): Promise<ChainsTvlData> {
  return fetchDefiLlama<ChainsTvlData>('/v2/chains');
}

/**
 * Get token prices by addresses
 * @param addresses Array of token addresses in format "chain:address" (e.g. ["ethereum:0x...")
 */
export async function getTokenPrices(addresses: string[]): Promise<TokenPricesResponse> {
  if (!addresses.length) return { coins: {} };
  
  const addressParam = addresses.join(',');
  return fetchDefiLlama<TokenPricesResponse>(`/prices/current/${addressParam}`, COINS_API_BASE_URL);
}

/**
 * Get historical token prices
 * @param address Token address in format "chain:address"
 * @param timestamp Unix timestamp (optional)
 */
export async function getHistoricalTokenPrice(address: string, timestamp?: number): Promise<HistoricalTokenPriceResponse> {
  const timestampParam = timestamp ? `/${timestamp}` : '';
  return fetchDefiLlama<HistoricalTokenPriceResponse>(`/prices/historical${timestampParam}/${address}`, COINS_API_BASE_URL);
}

/**
 * Get token chart data
 * @param address Token address in format "chain:address"
 * @param span Time span (e.g., "1d", "7d", "30d", "90d", "180d", "1y", "2y", "5y", "max")
 */
export async function getTokenChartData(address: string, span = '30d'): Promise<TokenChartData[]> {
  return fetchDefiLlama<TokenChartData[]>(`/chart/${address}?span=${span}`, COINS_API_BASE_URL);
}

/**
 * Get stablecoin data
 */
export async function getStablecoins(): Promise<StablecoinData> {
  return fetchDefiLlama<StablecoinData>('/stablecoins');
}

/**
 * Get yields for various protocols
 */
export async function getYields(): Promise<YieldData> {
  return fetchDefiLlama<YieldData>('/yields');
}

/**
 * Search for a token by name or symbol
 */
export async function searchTokens(query: string): Promise<SearchTokensResponse> {
  return fetchDefiLlama<SearchTokensResponse>(`/search?q=${encodeURIComponent(query)}`, COINS_API_BASE_URL);
}

/**
 * Get portfolio value by addresses
 * @param addresses Array of wallet addresses with chain prefix
 */
export async function getPortfolioValue(addresses: string[]): Promise<PortfolioResponse> {
  if (!addresses.length) return { portfolio: { totalUsd: 0, tokens: [] } };
  
  const addressParam = addresses.join(',');
  return fetchDefiLlama<PortfolioResponse>(`/portfolio/${addressParam}`);
}

export default {
  getProtocolData,
  getChainTvl,
  getAllChainsTvl,
  getTokenPrices,
  getHistoricalTokenPrice,
  getTokenChartData,
  getStablecoins,
  getYields,
  searchTokens,
  getPortfolioValue,
}; 