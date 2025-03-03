/** @type {import('next').NextConfig} */
const defaultConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'ipfs.moralis.io', 
      'ipfs.io', 
      'gateway.ipfs.io', 
      'cloudflare-ipfs.com', 
      'ipfs-2.thirdwebcdn.com',
      'hebbkx1anhila5yf.public.blob.vercel-storage.com'
    ],
  },
  // Remove the experimental section as appDir is no longer needed in Next.js 14+
};

// Merge with user config if it exists
function mergeConfig() {
  try {
    const { userConfig } = require('./v0-user-next.config.js');
    return {
      ...defaultConfig,
      ...userConfig,
    };
  } catch (e) {
    return defaultConfig;
  }
}

export default mergeConfig();
