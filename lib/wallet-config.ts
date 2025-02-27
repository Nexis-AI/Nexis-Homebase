import { defaultWagmiConfig } from '@web3modal/wagmi';
import { mainnet } from 'viem/chains';
import { http, fallback } from 'viem';
import { createPublicClient } from 'viem';

// 1. Define constants
// Use the environment variable for production deployment
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 
                         process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 
                         'e6d95ba9bbef9f6f5130d40cf0a93c2b';

// 2. Create wagmiConfig
export const metadata = {
  name: 'Nexis Protocol',
  description: 'Nexis Dashboard - Secure Wallet Dashboard',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://nexisnetwork.io',
  icons: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Nexis-Profile-Photo%20(1)%201-8LcRo5KayRrYjaJWdzJIkA1fdh4YZF.png']
};

// Define the chains - using an array with mainnet as the first element
export const chains = [mainnet];

// For production, use more reliable RPC endpoints with fallback
// Consider adding your own Alchemy or Infura API key for better reliability
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo';

// Configure multiple reliable RPC providers with fallback
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    // Primary endpoint with your API key if available
    http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`),
    // Fallbacks for reliability
    http('https://rpc.ankr.com/eth'),
    http('https://ethereum.publicnode.com'),
    http('https://cloudflare-eth.com'),
  ]),
});

// Create transport for reliable RPC connections
const transport = fallback([
  http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`),
  http('https://rpc.ankr.com/eth'),
  http('https://ethereum.publicnode.com'),
  http('https://cloudflare-eth.com'),
]);

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
  // Optional customization parameters
  ssr: true, // Optimize for server-side rendering
});

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