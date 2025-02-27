import { defaultWagmiConfig } from '@web3modal/wagmi';
import { mainnet } from 'viem/chains';
import { http, fallback, createClient } from 'viem';
import { createPublicClient } from 'viem';
import { normalize } from 'viem/ens';

// 1. Define constants
// Use the environment variable for production deployment
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 
                         process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 
                         'e6d95ba9bbef9f6f5130d40cf0a93c2b';

// Export our featured wallet IDs for use elsewhere
export const featuredWalletIds = [
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
  '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // OKX Wallet
  'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
  'ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18', // Wallet Connect
  'bf5786a58b4e1e99df6ad7b5c48661bf7a766e27f8bc1b8be3edc06fbba69e27', // Block Wallet
  'c3b083e0df8117dd4dde5546aca6aa8933bcbfc0a5940d7ed50dc616a598e2ce', // Phantom
  'ef333840daf915aafdc4a004525502d6d49d1c307bfcaf633f0a31990b01e678', // Bybit
  '19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927', // Ledger
];

// List of public, CORS-enabled Ethereum RPC endpoints
// For production, you should use a dedicated provider with higher rate limits
const PUBLIC_RPC_URLS = {
  // Public gateway endpoints that support CORS
  mainnet: [
    // Use the public endpoint from Alchemy that supports CORS for development
    'https://eth-mainnet.public.blastapi.io',
    'https://ethereum.publicnode.com',
    'https://1rpc.io/eth',
    'https://rpc.mevblocker.io',
    'https://rpc.flashbots.net'
  ]
};

// 2. Create metadata
export const metadata = {
  name: 'Nexis Protocol',
  description: 'Nexis Dashboard - Secure Wallet Dashboard',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://nexisnetwork.io',
  icons: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Nexis-Profile-Photo%20(1)%201-8LcRo5KayRrYjaJWdzJIkA1fdh4YZF.png']
};

// Define the chains - using an array with mainnet as the first element
export const chains = [mainnet];

// Configure RPC with optimized connection settings
const createTransport = (urls: string[]) => {
  return fallback(
    urls.map(url => http(url, {
      timeout: 6000, // Reduce timeout for faster connectivity perception
      fetchOptions: {
        // Important: Include CORS mode and credentials for browser compatibility
        mode: 'cors',
        credentials: 'omit',
        // Add cache control to avoid browser caching responses
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Prioritize speed and reduce latency
        priority: 'high',
      },
      // Add retry mechanism - reduced count for faster fail/success
      retryCount: 1,
      retryDelay: 500, // 0.5s between retries - faster recovery
    }))
  );
};

// Create public client with CORS-compatible settings and better error handling
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: createTransport(PUBLIC_RPC_URLS.mainnet),
  batch: {
    multicall: true, // Enable multicall to reduce number of requests
  },
  pollingInterval: 5000, // 5s polling interval - slightly longer to reduce calls
  cacheTime: 30_000, // 30s cache time for general RPC calls
});

// ENS resolution parameters - with safe defaults
export const ensConfig = {
  universalResolverAddress: '0x9C4c246Bd8F1D6e33e439C53B19c64F33d795aBF', // ENS Universal Resolver
  resolverMaxAge: 300_000, // 5 minutes cache for resolvers
  timeout: 5_000, // Reduce timeout for faster response
  retryCount: 1, // Only retry once for ENS operations
};

// Create transport for the wagmi config
const transport = createTransport(PUBLIC_RPC_URLS.mainnet);

// Web3Modal optimization settings
export const web3ModalConfig = {
  // Enable connection caching to remember previously used wallets
  enableConnectionCaching: true,
  
  // Enable wallet detection for faster prioritization
  enableWalletDetectionPreloading: true,
  
  // Optimize for performance
  enableAnalytics: false,
  
  // Use dark theme for better performance (fewer color calculations)
  themeMode: 'dark' as const,
  
  // Most common wallets first to optimize for most users
  featuredWalletIds,
  
  // Style optimization for faster rendering
  themeVariables: {
    '--w3m-accent': '#3694FF', // Nexis blue color
    '--w3m-border-radius-master': '8px',
    '--w3m-z-index': '999',
    '--w3m-font-family': 'Inter, sans-serif',
  },
};

// Production-ready wagmiConfig with optimized settings
export const wagmiConfig = defaultWagmiConfig({
  chains: [mainnet],
  projectId,
  metadata,
  enableInjected: true,
  enableCoinbase: true,
  enableEIP6963: true,
  enableWalletConnect: true,
  // For production, configure transports with fallback options
  transports: {
    [mainnet.id]: transport,
  },
  // SSR optimization
  ssr: true,
});

// Add type declarations for window extensions
declare global {
  interface Window {
    ethereum?: any;
    _hasWalletExtension?: boolean;
  }
}

// Preload the wallet detection
if (typeof window !== 'undefined') {
  // Detect browser extensions
  const detectWallets = () => {
    // Check for MetaMask or similar injected providers
    const hasInjected = typeof window.ethereum !== 'undefined';
    // Expose for debugging
    window._hasWalletExtension = hasInjected;
    return hasInjected;
  };
  
  // Run detection immediately
  detectWallets();
} 