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
  // Create http transports for each URL
  const transports = urls.map(url => 
    http(url, {
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
      // These are the valid options for http transport in viem 2.23.5
      retryCount: 3,
      retryDelay: 1000, // 1s delay between retries
    })
  );
  
  // Return a fallback transport
  return fallback(transports);
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

// Add type declarations for injected providers
interface InjectedProvider {
  [key: string]: unknown;
}

interface WalletProvider {
  name: string;
  provider: InjectedProvider;
}

// Update window extensions type declarations
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      providers?: Array<{isMetaMask?: boolean}>;
      [key: string]: unknown;
    };
    _hasWalletExtension?: boolean;
    _isMetaMask?: boolean;
    _walletProviders?: WalletProvider[];
    gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
    [key: string]: unknown;
  }
  interface WindowEventMap {
    'eip6963:announceProvider': CustomEvent<{
      info: { name: string; },
      provider: InjectedProvider;
    }>;
  }
}

// Add Keplr detection and handling
const detectWallets = () => {
  if (typeof window === 'undefined') return false;

  // Initialize wallet providers array if not exists
  window._walletProviders = window._walletProviders || [];
  
  // Check for injected providers in a specific order
  const checkProvider = (providerName: string): boolean => {
    const provider = window[providerName] as InjectedProvider | undefined;
    if (provider) {
      window._walletProviders?.push({
        name: providerName,
        provider
      });
      return true;
    }
    return false;
  };

  // Check wallets in priority order
  const walletPriority = ['keplr', 'ethereum', 'phantom', 'solflare'] as const;
  walletPriority.forEach(checkProvider);

  // Listen for EIP-6963 announcements
  window.addEventListener('eip6963:announceProvider', (event) => {
    const { info, provider } = event.detail;
    
    // Don't add duplicate providers
    if (window._walletProviders && 
        !window._walletProviders.some(p => p.name === info.name)) {
      window._walletProviders.push({
        name: info.name,
        provider
      });
    }
  });

  return (window._walletProviders?.length ?? 0) > 0;
};

// Initialize wallet detection
if (typeof window !== 'undefined') {
  // Run detection on load
  window.addEventListener('load', () => {
    setTimeout(detectWallets, 500);
  });
  
  // Run detection immediately in case window is already loaded
  detectWallets();
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