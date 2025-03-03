// ANKR RPC Configuration

// The ANKR API key from environment variables
export const ANKR_API_KEY = process.env.NEXT_PUBLIC_ANKR_API_KEY || 'd13b112acdac48e50f9c4ab66ee0754b4a1b30968e28ebd242814c4caf4e2bd0';

// Base URL for ANKR multichain RPC
export const ANKR_MULTICHAIN_RPC = `https://rpc.ankr.com/multichain/${ANKR_API_KEY}`;

// Each chain's individual RPC URLs
export const ANKR_RPC_URLS = {
  // Ethereum Mainnet
  '0x1': `https://rpc.ankr.com/eth/${ANKR_API_KEY}`,
  
  // Binance Smart Chain
  '0x38': `https://rpc.ankr.com/bsc/${ANKR_API_KEY}`,
  
  // Polygon
  '0x89': `https://rpc.ankr.com/polygon/${ANKR_API_KEY}`,
  
  // Arbitrum
  '0xa4b1': `https://rpc.ankr.com/arbitrum/${ANKR_API_KEY}`,
  
  // Optimism
  '0xa': `https://rpc.ankr.com/optimism/${ANKR_API_KEY}`,
  
  // Avalanche
  '0xa86a': `https://rpc.ankr.com/avalanche/${ANKR_API_KEY}`,
  
  // Fantom
  '0xfa': `https://rpc.ankr.com/fantom/${ANKR_API_KEY}`,
  
  // Base
  '0x2105': `https://rpc.ankr.com/base/${ANKR_API_KEY}`,
};

// Chain configurations with human-readable names
export const CHAIN_CONFIGS = {
  '0x1': {
    id: '0x1',
    name: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  '0x38': {
    id: '0x38',
    name: 'BNB Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    }
  },
  '0x89': {
    id: '0x89',
    name: 'Polygon',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  '0xa4b1': {
    id: '0xa4b1',
    name: 'Arbitrum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  '0xa': {
    id: '0xa',
    name: 'Optimism',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  '0xa86a': {
    id: '0xa86a',
    name: 'Avalanche',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18
    }
  },
  '0xfa': {
    id: '0xfa',
    name: 'Fantom',
    nativeCurrency: {
      name: 'FTM',
      symbol: 'FTM',
      decimals: 18
    }
  },
  '0x2105': {
    id: '0x2105',
    name: 'Base',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }
};

// Function to get RPC URL for a specific chain
export function getAnkrRpcUrl(chainId: string = '0x1'): string {
  return ANKR_RPC_URLS[chainId as keyof typeof ANKR_RPC_URLS] || ANKR_RPC_URLS['0x1'];
} 