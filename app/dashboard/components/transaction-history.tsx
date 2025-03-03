"use client";

import { useState, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { useMoralisData } from "@/lib/hooks/use-moralis-data";
import type { MoralisTransaction, MoralisTokenTransfer } from "@/lib/hooks/use-moralis-data";
import { SUPPORTED_CHAINS } from "@/lib/hooks/use-moralis-data";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TransactionHistoryProps {
  className?: string;
  transactions?: any[];
  isLoading?: boolean;
  walletAddress?: string;
}

// Combined transaction type for display
type CombinedTransaction = (MoralisTransaction | MoralisTokenTransfer) & {
  type: 'native' | 'token';
  formattedValue?: string;
  formattedTime?: string;
  isOutgoing?: boolean;
};

export function TransactionHistory({ 
  className,
  transactions = [],
  isLoading = false,
  walletAddress = ''
}: TransactionHistoryProps) {
  const { address } = useAccount();
  const [activeChain, setActiveChain] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({
    key: 'block_timestamp',
    direction: 'descending'
  });

  // Fetch transaction data from multiple chains
  const { allTransactions, allTokenTransfers, byChain, isLoading: moralisLoading, error } = useMoralisData({
    enabled: !!address,
  });

  // Format transaction value based on type
  const formatValue = useCallback((transaction: CombinedTransaction): string => {
    if (transaction.type === 'native') {
      const nativeTx = transaction as MoralisTransaction;
      const valueInEth = Number(nativeTx.value) / 1e18;
      return valueInEth.toFixed(valueInEth < 0.001 ? 6 : 4);
    }
    
    const tokenTx = transaction as MoralisTokenTransfer;
    if (!tokenTx.token_decimals) return '0';
    const valueInToken = Number(tokenTx.value) / (10 ** tokenTx.token_decimals);
    return valueInToken.toFixed(valueInToken < 0.001 ? 6 : 4);
  }, []);

  // Process and combine transactions
  const processTransactions = useCallback((
    nativeTransactions: MoralisTransaction[],
    tokenTransfers: MoralisTokenTransfer[]
  ): CombinedTransaction[] => {
    // Process native transactions
    const processedNative = nativeTransactions.map(tx => {
      const isOutgoing = tx.from_address.toLowerCase() === address?.toLowerCase();
      return {
        ...tx,
        type: 'native' as const,
        formattedValue: formatValue({ ...tx, type: 'native' }),
        formattedTime: formatDistanceToNow(new Date(tx.block_timestamp), { addSuffix: true }),
        isOutgoing
      };
    });

    // Process token transfers
    const processedTokens = tokenTransfers.map(tx => {
      const isOutgoing = tx.from_address.toLowerCase() === address?.toLowerCase();
      return {
        ...tx,
        type: 'token' as const,
        formattedValue: formatValue({ ...tx, type: 'token' }),
        formattedTime: formatDistanceToNow(new Date(tx.block_timestamp), { addSuffix: true }),
        isOutgoing
      };
    });

    // Combine and return
    return [...processedNative, ...processedTokens];
  }, [address, formatValue]);

  // Filter transactions based on active chain
  const filteredTransactions = useMemo(() => {
    let transactions: MoralisTransaction[] = [];
    let tokenTransfers: MoralisTokenTransfer[] = [];

    if (activeChain === 'all') {
      transactions = allTransactions;
      tokenTransfers = allTokenTransfers;
    } else {
      transactions = byChain[activeChain]?.transactions || [];
      tokenTransfers = byChain[activeChain]?.tokenTransfers || [];
    }

    // Process and combine transactions
    let combined = processTransactions(transactions, tokenTransfers);

    // Apply search filter if needed
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      combined = combined.filter(tx => {
        // Search in transaction hash
        if (tx.type === 'native' && (tx as MoralisTransaction).hash.toLowerCase().includes(query)) {
          return true;
        }
        if (tx.type === 'token' && (tx as MoralisTokenTransfer).transaction_hash.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search in addresses
        if (tx.from_address.toLowerCase().includes(query) || tx.to_address.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search in token info for token transfers
        if (tx.type === 'token') {
          const tokenTx = tx as MoralisTokenTransfer;
          if (
            (tokenTx.token_name?.toLowerCase().includes(query)) ||
            (tokenTx.token_symbol?.toLowerCase().includes(query))
          ) {
            return true;
          }
        }
        
        return false;
      });
    }

    // Apply sorting
    return combined.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof CombinedTransaction];
      const bValue = b[sortConfig.key as keyof CombinedTransaction];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (sortConfig.key === 'block_timestamp') {
        const dateA = new Date(aValue as string).getTime();
        const dateB = new Date(bValue as string).getTime();
        return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
      }
      
      if (sortConfig.key === 'formattedValue') {
        const numA = Number.parseFloat(aValue as string);
        const numB = Number.parseFloat(bValue as string);
        return sortConfig.direction === 'ascending' ? numA - numB : numB - numA;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'ascending' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
  }, [
    activeChain, 
    allTransactions, 
    allTokenTransfers, 
    byChain, 
    searchQuery, 
    processTransactions, 
    sortConfig
  ]);

  // Handle sort request
  const requestSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: 
        prevConfig.key === key && prevConfig.direction === 'ascending' 
          ? 'descending' 
          : 'ascending'
    }));
  };

  // Get Explorer URL for the transaction
  const getExplorerUrl = useCallback((tx: CombinedTransaction) => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === tx.chain);
    const chainName = chain?.name?.toLowerCase() || '';
    const hash = tx.type === 'native' 
      ? (tx as MoralisTransaction).hash 
      : (tx as MoralisTokenTransfer).transaction_hash;
    
    if (chainName === 'ethereum') {
      return `https://etherscan.io/tx/${hash}`;
    }
    
    if (chainName === 'polygon') {
      return `https://polygonscan.com/tx/${hash}`;
    }
    
    if (chainName === 'avalanche') {
      return `https://snowtrace.io/tx/${hash}`;
    }
    
    if (chainName === 'bsc') {
      return `https://bscscan.com/tx/${hash}`;
    }
    
    if (chainName === 'fantom') {
      return `https://ftmscan.com/tx/${hash}`;
    }
    
    if (chainName === 'optimism') {
      return `https://optimistic.etherscan.io/tx/${hash}`;
    }
    
    if (chainName === 'arbitrum') {
      return `https://arbiscan.io/tx/${hash}`;
    }
    
    return '#';
  }, []);

  // Truncate address for display
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Loading your transaction history...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["tx-skeleton-1", "tx-skeleton-2", "tx-skeleton-3", "tx-skeleton-4", "tx-skeleton-5"].map((id) => (
                <div key={id} className="flex items-center justify-between py-2">
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-5 w-1/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription className="text-red-500">
              Error loading transactions. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate chain counts for tab display
  const chainCounts = useMemo(() => {
    const counts: Record<string, number> = { 
      all: allTransactions.length + allTokenTransfers.length 
    };
    
    for (const chain of SUPPORTED_CHAINS) {
      const txCount = (byChain[chain.id]?.transactions?.length || 0) + 
                      (byChain[chain.id]?.tokenTransfers?.length || 0);
      if (txCount > 0) {
        counts[chain.id] = txCount;
      }
    }
    
    return counts;
  }, [allTransactions.length, allTokenTransfers.length, byChain]);

  // Render empty state if no transactions found
  if (filteredTransactions.length === 0 && !searchQuery) {
    return (
      <div className={`w-full ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {activeChain === 'all' 
                ? "No transactions found in your wallet." 
                : `No transactions found on ${SUPPORTED_CHAINS.find(c => c.id === activeChain)?.name || 'selected chain'}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Transactions will appear here once you start interacting with the blockchain.
            </p>
            {activeChain !== 'all' && (
              <Button
                variant="outline"
                onClick={() => setActiveChain('all')}
              >
                View all chains
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View your recent transactions across multiple blockchains
              </CardDescription>
            </div>
            
            {/* Search input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-8 pr-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  type="button"
                  className="absolute right-2 top-2.5"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
          
          {/* Chain selection tabs */}
          <Tabs
            value={activeChain}
            onValueChange={setActiveChain}
            className="w-full mt-2"
          >
            <TabsList className="flex flex-wrap gap-2 h-auto bg-background border">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                All ({chainCounts.all || 0})
              </TabsTrigger>
              
              {SUPPORTED_CHAINS.map(chain => {
                const count = chainCounts[chain.id];
                if (!count) return null;
                
                return (
                  <TabsTrigger
                    key={chain.id}
                    value={chain.id}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {chain.name} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          {filteredTransactions.length === 0 && searchQuery ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found matching your search.</p>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className="mt-2"
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">
                      <button 
                        type="button"
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => requestSort('type')}
                      >
                        Type
                        {sortConfig.key === 'type' && (
                          sortConfig.direction === 'ascending' 
                            ? <ChevronUp className="h-4 w-4" /> 
                            : <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        type="button"
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => requestSort('block_timestamp')}
                      >
                        Time
                        {sortConfig.key === 'block_timestamp' && (
                          sortConfig.direction === 'ascending' 
                            ? <ChevronUp className="h-4 w-4" /> 
                            : <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">
                      <button 
                        type="button"
                        className="flex items-center gap-1 ml-auto hover:text-foreground"
                        onClick={() => requestSort('formattedValue')}
                      >
                        Value
                        {sortConfig.key === 'formattedValue' && (
                          sortConfig.direction === 'ascending' 
                            ? <ChevronUp className="h-4 w-4" /> 
                            : <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Chain</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const txHash = tx.type === 'native' 
                      ? (tx as MoralisTransaction).hash 
                      : (tx as MoralisTokenTransfer).transaction_hash;
                    
                    const tokenInfo = tx.type === 'token' 
                      ? (tx as MoralisTokenTransfer)
                      : null;
                    
                    return (
                      <TableRow key={`${tx.chain}-${txHash}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {tx.isOutgoing ? (
                              <ArrowUpRight className="h-4 w-4 text-red-500" />
                            ) : (
                              <ArrowDownLeft className="h-4 w-4 text-green-500" />
                            )}
                            <span>
                              {tx.type === 'native' ? 'Native' : tokenInfo?.token_symbol || 'Token'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tx.formattedTime}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {truncateAddress(tx.from_address)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {truncateAddress(tx.to_address)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={tx.isOutgoing ? 'text-red-500' : 'text-green-500'}>
                            {tx.isOutgoing ? '-' : '+'}{tx.formattedValue}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {tx.type === 'native' 
                              ? tx.chainName === 'Ethereum' ? 'ETH' 
                                : tx.chainName === 'Polygon' ? 'MATIC'
                                : tx.chainName === 'Avalanche' ? 'AVAX'
                                : tx.chainName === 'BSC' ? 'BNB'
                                : tx.chainName === 'Fantom' ? 'FTM'
                                : tx.chainName === 'Optimism' ? 'ETH'
                                : tx.chainName === 'Arbitrum' ? 'ETH'
                                : 'NATIVE'
                              : tokenInfo?.token_symbol || 'TOKEN'
                            }
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{tx.chainName}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <a 
                            href={getExplorerUrl(tx)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-500 hover:text-blue-700"
                          >
                            View <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 