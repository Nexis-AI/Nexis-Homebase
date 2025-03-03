import { defaultWagmiConfig } from '@web3modal/wagmi';
import { mainnet, base, arbitrum, bsc } from 'viem/chains';
import { http, fallback, createClient } from 'viem';
import { createPublicClient } from 'viem';
import { normalize } from 'viem/ens';
import type { Chain } from 'viem';
import { ANKR_RPC_URLS } from './ankr-config';

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

// Define custom chains not available in viem/chains
export const zetachain = {
  id: 7000,
  name: 'ZetaChain Mainnet',
  network: 'zetachain',
  nativeCurrency: {
    decimals: 18,
    name: 'Zeta',
    symbol: 'ZETA',
  },
  rpcUrls: {
    public: { http: ['https://zetachain-evm.blockpi.network/v1/rpc/public'] },
    default: { http: ['https://zetachain-evm.blockpi.network/v1/rpc/public'] },
  },
  blockExplorers: {
    default: { name: 'ZetaScan', url: 'https://explorer.zetachain.com' },
  },
} as const;

// Define the chains - using an array with mainnet as the first element
export const chains = [mainnet, base, bsc, arbitrum, zetachain] as const;

// Production-optimized RPC URLs
// Using multiple high-quality endpoints with Ankr as primary source
// We prioritize paid/premium endpoints first for better reliability
export const RPC_URLS = {
  mainnet: [
    // Primary premium endpoints for production
    ANKR_RPC_URLS['0x1'],
    'https://eth.llamarpc.com',
    'https://rpc.builder0x69.io',
    'https://ethereum.publicnode.com',
    // Fallback endpoints
    'https://rpc.ankr.com/eth',
    'https://1.rpc.rivet.cloud',
    'https://eth.rpc.blxrbdn.com',
    'https://cloudflare-eth.com'
  ],
  base: [
    // Base network - Premium endpoints first
    ANKR_RPC_URLS['0x2105'],
    'https://base.llamarpc.com',
    'https://base.blockpi.network/v1/rpc/public',
    'https://base.publicnode.com',
    // Fallbacks
    'https://1rpc.io/base'
  ],
  arbitrum: [
    // Arbitrum - Premium endpoints first
    ANKR_RPC_URLS['0xa4b1'],
    'https://arbitrum.llamarpc.com',
    'https://arbitrum-one.public.blastapi.io',
    'https://arbitrum.blockpi.network/v1/rpc/public',
    // Fallbacks
    'https://arb1.arbitrum.io/rpc',
    'https://1rpc.io/arb'
  ],
  bsc: [
    // BSC - Premium endpoints first
    ANKR_RPC_URLS['0x38'],
    'https://bsc.publicnode.com',
    'https://bsc.blockpi.network/v1/rpc/public',
    // Fallbacks
    'https://bsc-dataseed.binance.org',
    'https://bsc-dataseed1.defibit.io',
    'https://1rpc.io/bnb'
  ],
  zetachain: [
    // ZetaChain - Premium endpoints first
    'https://zetachain-evm.blockpi.network/v1/rpc/public',
    'https://zetachain.blockpi.network/v1/rpc/public'
  ]
};

// 2. Create metadata
export const metadata = {
  name: 'Nexis Protocol',
  description: 'Nexis Dashboard - Secure Wallet Dashboard',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://nexisnetwork.io',
  icons: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Nexis-Profile-Photo%20(1)%201-8LcRo5KayRrYjaJWdzJIkA1fdh4YZF.png']
};

// Configure RPC with production-ready connection settings
const createTransport = (urls: string[]) => {
  return fallback(
    urls.map(url => http(url, {
      timeout: 10000, // 10s timeout for more reliable connections
      fetchOptions: {
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        priority: 'high',
      },
      // Enhanced retry mechanism for production
      retryCount: 3,
      retryDelay: 1000, // 1s delay between retries
      // Better error handling for production
      onError: (error) => {
        // Log minimal error info to avoid sensitive data leakage
        const errorMsg = error.message || 'Unknown RPC error';
        console.warn(`RPC connection issue: ${errorMsg.substring(0, 100)}${errorMsg.length > 100 ? '...' : ''}`);
        
        // Don't retry on explicit rejection errors
        if (errorMsg.includes('User rejected') || errorMsg.includes('user rejected')) {
          return false;
        }
        
        // Retry on network or timeout errors
        return true;
      }
    })),
    {
      // Production-optimized fallback settings
      maxRetries: 4,
      fallbackThreshold: 2,
      onTransportError: ({error, url}: {error: Error, url?: string}) => {
        if (url) {
          const hostname = url?.includes('://') ? new URL(url).hostname : url;
          
          // Log failed provider with minimal details
          console.warn(`RPC endpoint unavailable: ${hostname}`);
          
          // Store failed provider in sessionStorage to track reliability
          if (typeof window !== 'undefined') {
            try {
              const failureMap = JSON.parse(sessionStorage.getItem('rpc-failures') || '{}');
              failureMap[hostname] = (failureMap[hostname] || 0) + 1;
              sessionStorage.setItem('rpc-failures', JSON.stringify(failureMap));
              
              // If we have multiple failures, report analytics if available
              if (failureMap[hostname] > 3 && window.gtag) {
                try {
                  window.gtag('event', 'rpc_failure', {
                    endpoint: hostname,
                    count: failureMap[hostname]
                  });
                } catch (e) {
                  // Ignore analytics errors
                }
              }
            } catch (e) {
              // Ignore storage errors
            }
          }
        }
      }
    }
  );
};

// Create public client with production-optimized settings
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: createTransport(RPC_URLS.mainnet),
  batch: {
    multicall: true,
  },
  pollingInterval: 4000, // 4s polling interval - good balance for production
  cacheTime: 60_000, // 60s cache time for production
});

// ENS resolution parameters - production settings
export const ensConfig = {
  universalResolverAddress: '0x9C4c246Bd8F1D6e33e439C53B19c64F33d795aBF',
  resolverMaxAge: 300_000, // 5 minutes cache for resolvers
  timeout: 5_000,
  retryCount: 2, // Increased for production reliability
};

// Create transport for the wagmi config
const mainnetTransport = createTransport(RPC_URLS.mainnet);
const baseTransport = createTransport(RPC_URLS.base);
const arbitrumTransport = createTransport(RPC_URLS.arbitrum);
const bscTransport = createTransport(RPC_URLS.bsc);
const zetachainTransport = createTransport(RPC_URLS.zetachain);

// Web3Modal production-optimized settings
export const web3ModalConfig = {
  enableConnectionCaching: true,
  enableWalletDetectionPreloading: true,
  enableAnalytics: false, // Keep disabled for privacy
  themeMode: 'dark' as const,
  featuredWalletIds,
  themeVariables: {
    '--w3m-accent': '#3694FF', // Nexis blue color
    '--w3m-border-radius-master': '8px',
    '--w3m-z-index': '999',
    '--w3m-font-family': 'Inter, sans-serif',
  },
};

// Production-ready wagmiConfig with optimized settings
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableInjected: true,
  enableCoinbase: true,
  enableEIP6963: true,
  enableWalletConnect: true,
  // Production-ready transports with fallback options
  transports: {
    [mainnet.id]: mainnetTransport,
    [base.id]: baseTransport,
    [arbitrum.id]: arbitrumTransport,
    [bsc.id]: bscTransport,
    [zetachain.id]: zetachainTransport,
  },
  ssr: true,
});

// Add type declarations for window extensions
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      providers?: Array<{isMetaMask?: boolean}>;
      [key: string]: unknown;
    };
    _hasWalletExtension?: boolean;
    _isMetaMask?: boolean;
    _walletProviders?: Array<{name: string, provider: unknown}>;
    gtag?: (command: string, action: string, params?: Record<string, unknown>) => void; // For Google Analytics
  }
  interface WindowEventMap {
    'eip6963:announceProvider': CustomEvent<{
      info: { name: string; },
      provider: unknown;
    }>;
  }
}

// Track wallet connection errors for analytics
export function trackWalletError(errorType: string, message: string) {
  console.warn(`Wallet error (${errorType}): ${message}`);
  
  // Track error in analytics if available
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', 'wallet_error', {
        error_type: errorType,
        error_message: message.substring(0, 100) // Limit length for analytics
      });
    } catch (e) {
      // Ignore analytics errors
    }
  }
}

// Production utility to handle wallet connection timeouts
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    
    promise.then(
      (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

// Preload the wallet detection
if (typeof window !== 'undefined') {
  // Enhanced wallet detection with EIP-6963 support
  const detectWallets = () => {
    // Store detected wallets
    window._walletProviders = window._walletProviders || [];
    
    // Check for MetaMask or similar injected providers
    const hasInjected = typeof window.ethereum !== 'undefined';
    
    // Specific check for MetaMask
    const isMetaMask = hasInjected && (
      window.ethereum?.isMetaMask || 
      (window.ethereum?.providers && 
       window.ethereum?.providers.some((p: {isMetaMask?: boolean}) => p?.isMetaMask))
    );
    
    // Expose for debugging
    window._hasWalletExtension = hasInjected;
    window._isMetaMask = isMetaMask;
    
    console.log('Wallet detection:', { 
      hasInjectedProvider: hasInjected,
      isMetaMask: isMetaMask
    });
    
    return hasInjected;
  };
  
  // Listen for EIP-6963 wallet announcements
  window.addEventListener('eip6963:announceProvider', (event) => {
    const { info, provider } = event.detail;
    
    // Store the provider information
    window._walletProviders = window._walletProviders || [];
    window._walletProviders.push({
      name: info.name,
      provider: provider
    });
    
    console.log(`EIP-6963 wallet detected: ${info.name}`);
    window._hasWalletExtension = true;
  });
  
  // Run detection immediately and after window loads
  detectWallets();
  window.addEventListener('load', () => {
    // Run detection again after window loads to catch late-injected wallets
    setTimeout(detectWallets, 500);
  });
}

/**
 * IMPORTANT NOTE: WalletConnect Disconnection Handling
 * 
 * There is a known issue with WalletConnect where the disconnect method may not exist
 * or may be located in different places depending on the version and implementation.
 * 
 * We've implemented a patch in lib/wallet-disconnect-patch.ts to handle this issue:
 * - It tries multiple methods to disconnect gracefully (disconnect, close, reset, etc.)
 * - It falls back to localStorage cleanup if no disconnect method is available
 * - It properly handles errors during disconnection
 * 
 * When disconnecting a WalletConnect session, use the safeDisconnectWalletConnect utility:
 * 
 * ```
 * import { safeDisconnectWalletConnect } from '../lib/wallet-disconnect-patch';
 * safeDisconnectWalletConnect(walletConnectProvider);
 * ```
 * 
 * This ensures consistent and reliable disconnection across different WalletConnect versions.
 */ 