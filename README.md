# Nexis Homebase

Nexis Homebase is a dashboard application for managing and monitoring your crypto assets. It provides a user-friendly interface to view your portfolio, track token balances, manage transactions, and monitor token approvals.

## Features

- Wallet connection using various providers
- Real-time portfolio valuation and performance tracking
- Token balance monitoring with price updates
- Transaction history
- Token approval management
- Custom token support

## Tech Stack

- Next.js
- React
- TypeScript
- Wagmi (Ethereum interactions)
- TailwindCSS
- Radix UI components
- Web3Modal

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/nexis-ai/Nexis-Homebase.git
cd Nexis-Homebase

# Install dependencies
npm install
# or
yarn install

# Start the development server
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `/app` - Next.js application pages and routing
- `/components` - React components
- `/lib` - Utility functions, hooks, and configurations
- `/public` - Static assets
- `/styles` - Global styles

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is proprietary and owned by Nexis AI.

## Web3 Wallet Integration

### WalletConnect Setup

To set up WalletConnect for your project:

1. Create an account at [WalletConnect Cloud](https://cloud.walletconnect.com/).
2. Create a new project and copy the project ID.
3. Create a `.env.local` file in your project root with the following content:

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
```

4. Add your domain(s) to the allowed domains list in your WalletConnect Cloud project settings:
   - For development: `localhost:3000`
   - For production: Your production domain (e.g., `app.your-domain.com`)

If a valid WalletConnect Project ID is not set, the application will fall back to using a default Project ID, but for production use, you should always use your own.

### RPC Configuration

The application is configured with multiple fallback RPC providers for maximum reliability:

1. Blast API (Public Gateway) - CORS-enabled
2. PublicNode's Ethereum endpoint - CORS-enabled 
3. 1RPC Ethereum endpoint - CORS-enabled
4. MEV Blocker RPC - CORS-enabled
5. Flashbots RPC - CORS-enabled

We've specifically selected public RPC endpoints that support CORS for browser-based applications.

For production deployments, we recommend:

1. Setting up your own RPC proxy server that forwards requests to Ethereum nodes
2. Using a dedicated provider like Alchemy or Infura with an API key
3. Configuring proper CORS headers if you're self-hosting an Ethereum node

#### Common RPC Connection Issues

If you encounter RPC connection issues:

- **CORS Errors**: Browser-based apps can only connect to RPC endpoints that have CORS headers enabled
- **Rate Limiting**: Public RPC endpoints often have strict rate limits and may return 429 errors
- **Resource Limitations**: Free/public endpoints may return insufficient resource errors under load

The application includes fallback and error handling to mitigate these issues.

### Advanced Wallet Configuration

The wallet configuration supports:

- Multiple wallet types (MetaMask, Coinbase Wallet, WalletConnect, etc.)
- Server-side rendering optimization
- Custom theming and styling
- Featured wallets to improve user experience
- Network fallback for reliability 