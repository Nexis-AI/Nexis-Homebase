## Core Mock Data Files

### Wallet & Transaction Data

1. **lib/moralis-client.ts**
   - **Type**: Portfolio history mock data
   - **Description**: Generates mock portfolio history with random fluctuations for the `getWalletPortfolioHistory` function
   - **Lines**: ~117-147
   - **Usage**: Used when real Moralis portfolio history is not available
   - **Notes**: Returns mock data that fluctuates but trends upward over time

2. **lib/hooks/use-wallet-data.ts**
   - **Type**: Token balances mock data 
   - **Description**: Contains a sample token list that includes a mock token for "Nexis Token" (NZT)
   - **Usage**: Used for token balance display in Portfolio section

3. **app/dashboard/utils/generate-chart-data.ts**
   - **Type**: Price chart data generator
   - **Description**: Generates synthetic chart data for token price visualization
   - **Lines**: 25-68
   - **Usage**: Creates simulated price data points with configurable volatility
   - **Notes**: Used for token price charts when real data is unavailable

### News & Content

4. **app/dashboard/news/data.ts**
   - **Type**: Blog posts and categories
   - **Description**: Contains mock blog post data and category definitions
   - **Lines**: 1-30
   - **Usage**: Populates the news section with sample content
   - **Notes**: Includes category colors, featured posts, and metadata

## Component-Specific Mock Data

5. **app/dashboard/components/portfolio-section.tsx**
   - **Type**: Token balances for portfolio display
   - **Description**: Defines the `TokenBalance` interface and handles sorting/displaying token information
   - **Usage**: For portfolio summary and asset table in dashboard

6. **app/dashboard/components/activity-section.tsx**
   - **Type**: Transaction activities 
   - **Description**: Defines `Activity` interface and handles formatting/display of transaction activities
   - **Usage**: For displaying recent user transactions in a table format

7. **app/dashboard/components/custom-tokens.tsx**
   - **Type**: Custom token management
   - **Description**: Handles user-defined custom tokens with their properties
   - **Usage**: For displaying and managing user-added custom tokens

## API Interface Definitions

8. **lib/hooks/use-moralis-data.ts**
   - **Type**: Interface definitions for Moralis data
   - **Description**: Defines interfaces for `MoralisToken`, `MoralisNFT`, `MoralisTransaction`, `MoralisApproval`, and `PortfolioHistoryItem`
   - **Lines**: 13-58
   - **Usage**: Used throughout the application to type Moralis API responses

## Mock Data Usage Patterns

### Development Fallbacks

Many components use conditional rendering to display mock data when real data is unavailable:

```typescript
// Example pattern
const data = realData || mockData;
```

### Loading States

Most components implement skeleton loading states while data is being fetched:

```tsx
{isLoading ? <Skeleton /> : <ActualContent data={data} />}
```

## Recommendations for Production

1. Replace the mock portfolio history generation in `moralis-client.ts` with real API calls
2. Ensure all news content is fetched from a CMS or API instead of the hard-coded data in `news/data.ts`
3. Remove the chart data generator or use it only as a fallback
4. Remove any sample tokens from token lists in production builds
