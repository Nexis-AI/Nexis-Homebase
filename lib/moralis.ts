import { initMoralis as initMoralisClient } from './moralis-client';

/**
 * Initialize Moralis SDK with API key
 * Re-exports the initialization function from moralis-client.ts for backward compatibility
 */
export const initMoralis = initMoralisClient; 