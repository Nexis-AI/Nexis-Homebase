# Nexis Dashboard Project Directory Structure

## Root Directory
- `.cursor/` - Cursor IDE configuration
- `.git/` - Git repository data
- `.next/` - Next.js build output
- `app/` - Main application pages and routes
- `components/` - Reusable UI components
- `hooks/` - Custom React hooks
- `lib/` - Utility functions and libraries
- `node_modules/` - Node.js dependencies
- `public/` - Static files
- `src/` - Additional source code
- `styles/` - CSS and styling files
- `.cursorrules` - Cursor IDE rules
- `.env` - Environment variables
- `.env.local` - Local environment variables
- `.gitignore` - Git ignore configuration
- `components.json` - Component configuration
- `directory.md` - This file
- `localhost-1740632593501.log` - Local server log
- `next-env.d.ts` - Next.js TypeScript declarations
- `next.config.mjs` - Next.js configuration
- `package-lock.json` - npm dependency lock file
- `package.json` - Project configuration and dependencies
- `postcss.config.mjs` - PostCSS configuration
- `README.md` - Project documentation
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `tsconfig.tsbuildinfo` - TypeScript build information
- `v0-user-next.config.js` - Additional Next.js configuration

## App Directory Structure
- `app/`
  - `components/` - App-specific components
  - `dashboard/` - Dashboard pages
    - `bridge/` - Bridge functionality
    - `components/` - Dashboard-specific components
    - `ecosystem/` - Ecosystem section
    - `faucet/` - Faucet functionality
    - `leaderboard/` - Leaderboard section
    - `news/` - News section
    - `quests/` - Quests functionality
    - `stake/` - Staking functionality
    - `tools/` - Utility tools
    - `utils/` - Dashboard utilities
    - `verify/` - Verification functionality
    - `vesting/` - Vesting functionality
    - `error.tsx` - Error handling component
    - `layout.tsx` - Dashboard layout component
    - `page.tsx` - Main dashboard page
  - `vesting/` - Vesting pages
  - `welcome/` - Welcome/onboarding pages
  - `globals.css` - Global CSS styles
  - `layout.tsx` - Main app layout
  - `page.tsx` - Root page component
  - `types.ts` - TypeScript type definitions

## Components Directory Structure
- `components/`
  - `ui/` - UI components
    - (Multiple UI components like buttons, cards, dialogs, etc.)
  - `profile-badge.tsx` - User profile badge component
  - `profile-panel.tsx` - User profile panel component
  - `rank-badge.tsx` - Rank display badge component
  - `theme-provider.tsx` - Theme context provider
  - `usage-circle.tsx` - Usage circle visualization
  - `wallet-connect-button.tsx` - Wallet connection button
  - `web3modal-button.tsx` - Web3Modal integration button

## Library Directory Structure
- `lib/`
  - `hooks/` - Custom hooks
    - `use-local-storage.ts` - LocalStorage hook
    - `use-moralis-data.ts` - Moralis data integration hook
    - `use-token-prices.ts` - Token pricing hook
    - `use-wallet-data.ts` - Wallet data management hook
  - `moralis-client.ts` - Moralis client configuration
  - `utils.ts` - Utility functions
  - `wallet-config.ts` - Wallet configuration
  - `wallet-provider.tsx` - Wallet provider component
  - `web3auth.tsx` - Web3 authentication

## Technology Stack
- Next.js (React framework)
- TypeScript
- Tailwind CSS
- Moralis Web3 API integration
- Web3Modal for wallet connections
