import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatEther, formatUnits } from 'viem';
import { useWalletData } from '@/lib/hooks/use-wallet-data';
import useMoralisData from '@/lib/hooks/use-moralis-data';
import useDefiLlamaData from '@/lib/hooks/use-defillama-data';
import { formatCurrency } from '@/lib/utils';
import { chainIdToName } from '@/lib/ankr-config';

// Helper function to format large numbers
function formatNumber(value: number | string | undefined): string {
  if (value === undefined) return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
    minimumFractionDigits: 2
  }).format(num);
}

// Helper function to get chain icon
function getChainIcon(chainId: string | number): string {
  // Convert to string for consistency
  const chain = String(chainId).toLowerCase();
  
  // Map of chain IDs to icon URLs
  const chainIcons: Record<string, string> = {
    '1': 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg',
    'ethereum': 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg',
    '137': 'https://icons.llamao.fi/icons/chains/rsz_polygon.jpg',
    'polygon': 'https://icons.llamao.fi/icons/chains/rsz_polygon.jpg',
    '56': 'https://icons.llamao.fi/icons/chains/rsz_binance.jpg',
    'binance': 'https://icons.llamao.fi/icons/chains/rsz_binance.jpg',
    '43114': 'https://icons.llamao.fi/icons/chains/rsz_avalanche.jpg',
    'avalanche': 'https://icons.llamao.fi/icons/chains/rsz_avalanche.jpg',
    '42161': 'https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg',
    'arbitrum': 'https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg',
    '10': 'https://icons.llamao.fi/icons/chains/rsz_optimism.jpg',
    'optimism': 'https://icons.llamao.fi/icons/chains/rsz_optimism.jpg',
    '250': 'https://icons.llamao.fi/icons/chains/rsz_fantom.jpg',
    'fantom': 'https://icons.llamao.fi/icons/chains/rsz_fantom.jpg',
    '8453': 'https://icons.llamao.fi/icons/chains/rsz_base.jpg',
    'base': 'https://icons.llamao.fi/icons/chains/rsz_base.jpg',
  };
  
  return chainIcons[chain] || 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg';
}

export function MultiChainPortfolio() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('overview');
  const [supportedChains, setSupportedChains] = useState<string[]>([]);
  
  // Fetch wallet data from connected account
  const {
    balance: ethBalance,
    isLoadingBalance: isLoadingEthBalance,
    error: ethError,
  } = useWalletData();
  
  // Fetch Moralis data for EVM chains
  const {
    balances: moralisBalances,
    nfts: moralisNfts,
    isLoading: isLoadingMoralis,
    error: moralisError,
  } = useMoralisData(address);
  
  // Fetch DefiLlama data for a comprehensive view
  const {
    portfolio: defiLlamaPortfolio,
    isLoading: isLoadingDefiLlama,
    error: defiLlamaError,
  } = useDefiLlamaData({
    walletAddresses: address ? [address] : [],
    enabled: !!address,
  });
  
  const isLoading = isLoadingEthBalance || isLoadingMoralis || isLoadingDefiLlama;
  const hasError = ethError || moralisError || defiLlamaError;
  
  // Determine supported chains from the data
  useEffect(() => {
    const chains = new Set<string>();
    
    // Add Ethereum by default if we have a connected wallet
    if (address) {
      chains.add('ethereum');
    }
    
    // Add chains from Moralis data
    if (moralisBalances?.length) {
      moralisBalances.forEach(balance => {
        if (balance.chain) {
          chains.add(balance.chain.toLowerCase());
        }
      });
    }
    
    // Add chains from DefiLlama data
    if (defiLlamaPortfolio?.tokens) {
      defiLlamaPortfolio.tokens.forEach(token => {
        chains.add(token.chain.toLowerCase());
      });
    }
    
    setSupportedChains(Array.from(chains));
  }, [address, moralisBalances, defiLlamaPortfolio]);
  
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Multi-Chain Portfolio</CardTitle>
          <CardDescription>Connect your wallet to view your portfolio</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Multi-Chain Portfolio</span>
          {defiLlamaPortfolio && (
            <Badge variant="outline" className="text-lg">
              ${formatNumber(defiLlamaPortfolio.totalUsd)}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          View your assets across multiple blockchains
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-6">
          {isLoading ? (
            <PortfolioSkeleton />
          ) : hasError ? (
            <div className="p-4 text-center text-red-500">
              Error loading portfolio data. Please try again.
            </div>
          ) : (
            <>
              <TabsContent value="overview" className="mt-0">
                <PortfolioOverview 
                  defiLlamaPortfolio={defiLlamaPortfolio} 
                  supportedChains={supportedChains} 
                />
              </TabsContent>
              
              <TabsContent value="tokens" className="mt-0">
                <TokensList 
                  moralisBalances={moralisBalances} 
                  defiLlamaPortfolio={defiLlamaPortfolio} 
                />
              </TabsContent>
              
              <TabsContent value="nfts" className="mt-0">
                <NftsList nfts={moralisNfts} />
              </TabsContent>
            </>
          )}
        </CardContent>
      </Tabs>
      
      <CardFooter className="text-xs text-muted-foreground">
        Data provided by Moralis, ANKR, and DefiLlama
      </CardFooter>
    </Card>
  );
}

// Overview Tab Content
function PortfolioOverview({ 
  defiLlamaPortfolio, 
  supportedChains 
}: { 
  defiLlamaPortfolio: any; 
  supportedChains: string[];
}) {
  // Group tokens by chain
  const portfolioByChain: Record<string, { totalUsd: number; tokens: any[] }> = {};
  
  if (defiLlamaPortfolio?.tokens) {
    defiLlamaPortfolio.tokens.forEach((token: any) => {
      const chain = token.chain.toLowerCase();
      
      if (!portfolioByChain[chain]) {
        portfolioByChain[chain] = {
          totalUsd: 0,
          tokens: []
        };
      }
      
      portfolioByChain[chain].tokens.push(token);
      portfolioByChain[chain].totalUsd += token.usdValue || 0;
    });
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {supportedChains.length > 0 ? (
          supportedChains.map(chain => {
            const chainData = portfolioByChain[chain] || { totalUsd: 0, tokens: [] };
            const displayName = chainIdToName[chain] || chain.charAt(0).toUpperCase() + chain.slice(1);
            
            return (
              <Card key={chain} className="overflow-hidden">
                <div className="flex p-4 items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <img src={getChainIcon(chain)} alt={displayName} />
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{displayName}</h3>
                    <p className="text-lg font-bold">${formatNumber(chainData.totalUsd)}</p>
                  </div>
                </div>
                <div className="border-t px-4 py-2 bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    {chainData.tokens.length} tokens found
                  </p>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center p-4">
            No chain data available
          </div>
        )}
      </div>
      
      {defiLlamaPortfolio?.tokens && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Top Assets</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defiLlamaPortfolio.tokens
                .sort((a: any, b: any) => b.usdValue - a.usdValue)
                .slice(0, 5)
                .map((token: any, index: number) => (
                  <TableRow key={`${token.chain}-${token.address}-${index}`}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {token.logo ? (
                        <img 
                          src={token.logo} 
                          alt={token.symbol} 
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          {token.symbol.charAt(0)}
                        </div>
                      )}
                      <span>{token.symbol}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img 
                          src={getChainIcon(token.chain)} 
                          alt={token.chain} 
                          className="w-4 h-4 rounded-full"
                        />
                        <span>{token.chain.charAt(0).toUpperCase() + token.chain.slice(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatNumber(token.balance)}</TableCell>
                    <TableCell className="text-right">${formatNumber(token.usdValue)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// Tokens Tab Content
function TokensList({ 
  moralisBalances, 
  defiLlamaPortfolio 
}: { 
  moralisBalances: any[]; 
  defiLlamaPortfolio: any;
}) {
  // Combine and deduplicate tokens from Moralis and DefiLlama
  const tokens = defiLlamaPortfolio?.tokens || [];
  
  // Sort by USD value
  const sortedTokens = [...tokens].sort((a, b) => b.usdValue - a.usdValue);
  
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Token</TableHead>
            <TableHead>Chain</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTokens.length > 0 ? (
            sortedTokens.map((token: any, index: number) => (
              <TableRow key={`${token.chain}-${token.address}-${index}`}>
                <TableCell className="font-medium flex items-center gap-2">
                  {token.logo ? (
                    <img 
                      src={token.logo} 
                      alt={token.symbol} 
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      {token.symbol.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div>{token.symbol}</div>
                    <div className="text-xs text-muted-foreground">{token.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <img 
                      src={getChainIcon(token.chain)} 
                      alt={token.chain} 
                      className="w-4 h-4 rounded-full"
                    />
                    <span>{token.chain.charAt(0).toUpperCase() + token.chain.slice(1)}</span>
                  </div>
                </TableCell>
                <TableCell>{formatNumber(token.balance)}</TableCell>
                <TableCell>${formatNumber(token.price)}</TableCell>
                <TableCell className="text-right">${formatNumber(token.usdValue)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6">
                No tokens found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// NFTs Tab Content
function NftsList({ nfts }: { nfts: any[] }) {
  if (!nfts || nfts.length === 0) {
    return (
      <div className="text-center py-6">
        No NFTs found
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {nfts.map((nft, index) => {
        const metadata = nft.metadata ? 
          (typeof nft.metadata === 'string' ? JSON.parse(nft.metadata) : nft.metadata) : 
          {};
        
        const imageUrl = metadata.image || 
          (nft.normalized_metadata?.image || 
           nft.token_uri);
        
        return (
          <Card key={`${nft.token_address}-${nft.token_id}-${index}`} className="overflow-hidden">
            <div className="aspect-square bg-muted relative overflow-hidden">
              {imageUrl ? (
                <img 
                  src={imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
                  alt={metadata.name || `NFT #${nft.token_id}`}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).onerror = null;
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=NFT';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-muted">
                  <span>No Image</span>
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <h4 className="font-medium truncate">
                {metadata.name || nft.name || `#${nft.token_id}`}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {nft.contract_type || 'ERC-721'} · {nft.token_id}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Loading Skeleton
function PortfolioSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="flex p-4 items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            <div className="border-t px-4 py-2 bg-muted/50">
              <Skeleton className="h-4 w-16" />
            </div>
          </Card>
        ))}
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default MultiChainPortfolio; 