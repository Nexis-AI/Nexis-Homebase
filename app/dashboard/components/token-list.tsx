import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Search, ArrowUpDown, Plus } from 'lucide-react';
import { useMoralisData } from '@/lib/hooks/use-moralis-data';
import useDefiLlamaData from '@/lib/hooks/use-defillama-data';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Create our own mapping if not available in ankr-config
const chainIdToName: Record<string, string> = {
  'ethereum': 'Ethereum',
  'polygon': 'Polygon',
  'bsc': 'BNB Chain',
  'avalanche': 'Avalanche',
  'fantom': 'Fantom',
  'arbitrum': 'Arbitrum',
  'optimism': 'Optimism',
  // Add other chains as needed
};

// Helper function to get explorer URL if not available in ankr-config
const getChainExplorerUrl = (chain: string, type: 'address' | 'tx', value: string): string => {
  const explorers: Record<string, string> = {
    'ethereum': 'https://etherscan.io',
    'polygon': 'https://polygonscan.com',
    'bsc': 'https://bscscan.com',
    'avalanche': 'https://snowtrace.io',
    'fantom': 'https://ftmscan.com',
    'arbitrum': 'https://arbiscan.io',
    'optimism': 'https://optimistic.etherscan.io',
    // Add other explorers as needed
  };

  const baseUrl = explorers[chain];
  if (!baseUrl) return '';

  return `${baseUrl}/${type}/${value}`;
};

interface TokenBalance {
  symbol: string;
  name: string;
  contractAddress: string;
  balance: string;
  decimals: number;
  chain: string;
  logo?: string;
  price?: number; // USD price
  value?: number; // USD value
}

export function TokenList() {
  const { address } = useAccount();
  const [activeChain, setActiveChain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof TokenBalance; direction: 'asc' | 'desc' }>({
    key: 'value',
    direction: 'desc'
  });
  const [isAddTokenDialogOpen, setIsAddTokenDialogOpen] = useState(false);
  
  const {
    balances,
    isLoading: isLoadingBalances,
    error: balancesError,
  } = useMoralisData(address);
  
  // Extract token addresses for price fetching
  const tokenAddresses = useMemo(() => {
    if (!balances || !Array.isArray(balances)) return [];
    
    return balances.reduce((addresses: string[], token) => {
      if (token.token_address && token.chain) {
        addresses.push(`${token.chain}:${token.token_address}`);
      }
      return addresses;
    }, []);
  }, [balances]);
  
  // Fetch token prices from DeFiLlama
  const {
    tokenPrices,
    isLoading: isLoadingPrices,
    error: pricesError,
  } = useDefiLlamaData({
    tokenAddresses,
    enabled: tokenAddresses.length > 0,
  });
  
  // Process token balances with prices
  const processedBalances = useMemo(() => {
    if (!balances || !Array.isArray(balances)) return [];
    
    return balances.map((token) => {
      const balance = token.balance || '0';
      const decimals = Number.parseInt(token.decimals || '0', 10);
      const formattedBalance = Number.parseFloat(
        (BigInt(balance) * BigInt(10000) / BigInt(10 ** decimals)).toString()
      ) / 10000;
      
      // Get token price from DeFiLlama
      const priceKey = token.token_address ? `${token.chain}:${token.token_address}` : '';
      const price = tokenPrices && priceKey ? tokenPrices[priceKey] || 0 : 0;
      const value = price * formattedBalance;
      
      return {
        symbol: token.symbol || 'Unknown',
        name: token.name || token.symbol || 'Unknown Token',
        contractAddress: token.token_address || '',
        balance: formattedBalance.toString(),
        decimals,
        chain: token.chain || 'ethereum',
        logo: token.logo || '',
        price,
        value,
      } as TokenBalance;
    });
  }, [balances, tokenPrices]);
  
  // Filter tokens based on active chain and search query
  const filteredTokens = useMemo(() => {
    return processedBalances.filter((token) => {
      const matchesChain = activeChain === 'all' || token.chain === activeChain;
      const matchesSearch = searchQuery === '' || 
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesChain && matchesSearch;
    });
  }, [processedBalances, activeChain, searchQuery]);
  
  // Sort tokens
  const sortedTokens = useMemo(() => {
    return [...filteredTokens].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredTokens, sortConfig]);
  
  // Get total portfolio value
  const totalValue = useMemo(() => {
    if (activeChain === 'all') {
      return sortedTokens.reduce((sum, token) => sum + (token.value || 0), 0);
    }
    return sortedTokens.reduce((sum, token) => {
      if (token.chain === activeChain) {
        return sum + (token.value || 0);
      }
      return sum;
    }, 0);
  }, [sortedTokens, activeChain]);
  
  // Get unique chains from all tokens
  const chains = useMemo(() => {
    return Array.from(new Set(processedBalances.map(token => token.chain)))
      .filter(Boolean)
      .sort();
  }, [processedBalances]);
  
  // Handle sort click
  const handleSort = (key: keyof TokenBalance) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSortConfig({
        key,
        direction: 'desc'
      });
    }
  };
  
  const formatUSD = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } 
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } 
    if (value >= 1) {
      return `$${value.toFixed(2)}`;
    } 
    if (value > 0) {
      return `$${value.toFixed(4)}`;
    } 
    return '$0.00';
  };
  
  const formatNumber = (value: string | number, decimals = 6) => {
    const num = typeof value === 'string' ? Number.parseFloat(value) : value;
    if (isNaN(num)) return '0';
    
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } 
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    } 
    if (num >= 1) {
      return num.toFixed(4);
    } 
    if (num > 0) {
      return num.toLocaleString('en-US', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
      });
    } 
    return '0';
  };
  
  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
          <CardDescription>Connect your wallet to view your tokens</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <CardTitle>Token Balances</CardTitle>
            <CardDescription>
              Total Value: {formatUSD(totalValue)}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 sm:mt-0"
            onClick={() => setIsAddTokenDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Token
          </Button>
        </div>
      </CardHeader>
      
      <Tabs value={activeChain} onValueChange={setActiveChain}>
        <div className="px-6">
          <TabsList className="w-full grid" style={{ 
            gridTemplateColumns: `repeat(${Math.min(chains.length + 1, 6)}, minmax(0, 1fr))` 
          }}>
            <TabsTrigger value="all">All Chains</TabsTrigger>
            {chains.slice(0, 5).map((chain) => (
              <TabsTrigger key={`chain-${chain}`} value={chain} className="flex items-center gap-2">
                <img 
                  src={`https://icons.llamao.fi/icons/chains/rsz_${chain}.jpg`}
                  alt={`${chainIdToName[chain] || chain} chain icon`}
                  className="w-4 h-4 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {chainIdToName[chain] || chain}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        <CardContent className="pt-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tokens..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {isLoadingBalances || isLoadingPrices ? (
            <TokenSkeleton />
          ) : balancesError || pricesError ? (
            <div className="p-4 text-center text-red-500">
              Error loading token data. Please try again.
            </div>
          ) : sortedTokens.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-muted-foreground">No tokens found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Token</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('balance')}>
                      <div className="flex items-center">
                        Balance
                        {sortConfig.key === 'balance' && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 ${
                            sortConfig.direction === 'asc' ? 'rotate-180' : ''
                          }`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('price')}>
                      <div className="flex items-center">
                        Price
                        {sortConfig.key === 'price' && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 ${
                            sortConfig.direction === 'asc' ? 'rotate-180' : ''
                          }`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('value')}>
                      <div className="flex items-center">
                        Value
                        {sortConfig.key === 'value' && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 ${
                            sortConfig.direction === 'asc' ? 'rotate-180' : ''
                          }`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTokens.map((token) => (
                    <TableRow key={`${token.chain}-${token.contractAddress}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {token.logo ? (
                            <img
                              src={token.logo}
                              alt={`${token.symbol} logo`}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-xs">{token.symbol.substring(0, 2)}</span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              {token.name}
                              <Badge variant="outline" className="ml-1 text-xs">
                                {chainIdToName[token.chain] || token.chain}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatNumber(token.balance)}</TableCell>
                      <TableCell>{token.price ? formatUSD(token.price) : '-'}</TableCell>
                      <TableCell>{token.value ? formatUSD(token.value) : '-'}</TableCell>
                      <TableCell className="text-right">
                        {getChainExplorerUrl(token.chain, 'address', token.contractAddress) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(getChainExplorerUrl(
                              token.chain, 
                              'address', 
                              token.contractAddress
                            ), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Tabs>
      
      {/* Add Token Dialog */}
      <Dialog open={isAddTokenDialogOpen} onOpenChange={setIsAddTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Token</DialogTitle>
            <DialogDescription>
              Enter the token contract address to add it to your wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="chainSelect">
                Select Chain
              </label>
              <select 
                id="chainSelect"
                className="w-full p-2 rounded-md border"
              >
                {chains.map((chain) => (
                  <option key={chain} value={chain}>
                    {chainIdToName[chain] || chain}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="tokenAddress">
                Token Contract Address
              </label>
              <Input
                id="tokenAddress"
                placeholder="0x..."
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>Add Token</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TokenSkeleton() {
  return (
    <div className="space-y-4">
      {Array(5).fill(0).map((_, i) => (
        <Skeleton key={`skeleton-${i}`} className="h-16 w-full" />
      ))}
    </div>
  );
}

export default TokenList; 