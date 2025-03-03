import { useState } from 'react';
import { useFirebaseMoralis } from '@/lib/hooks/use-firebase-moralis';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface WalletDataDisplayProps {
  address: string;
  chainId?: string;
}

export function WalletDataDisplay({ address, chainId = '0x1' }: WalletDataDisplayProps) {
  const [activeTab, setActiveTab] = useState('balances');
  
  const {
    data,
    cachedData,
    loading,
    error,
    refetch,
    updateCollection
  } = useFirebaseMoralis(address, chainId, {
    includeNFTs: true,
    includeHistory: true,
    listenForUpdates: true
  });
  
  const handleRefresh = () => {
    refetch();
  };
  
  const handleUpdateCollection = (collection: 'tokenBalances' | 'nfts' | 'transactions' | 'tokenApprovals' | 'portfolioHistory') => {
    updateCollection(collection);
  };
  
  if (error) {
    return (
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Wallet Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button onClick={refetch} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Wallet Dashboard</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh All
            </>
          )}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Wallet: {address}</CardTitle>
          <CardDescription>
            {data?.lastUpdated ? (
              <>Last updated: {new Date(data.lastUpdated).toLocaleString()}</>
            ) : (
              <>Loading wallet data...</>
            )}
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="balances" className="p-4">
            <div className="flex justify-end mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleUpdateCollection('tokenBalances')}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
            
            {data?.tokenBalances && data.tokenBalances.length > 0 ? (
              <div className="space-y-4">
                {data.tokenBalances.map((token, index) => (
                  <div key={index} className="flex justify-between p-3 rounded-md bg-slate-100 dark:bg-slate-800">
                    <div className="flex items-center">
                      {token.logo && (
                        <img 
                          src={token.logo} 
                          alt={token.symbol} 
                          className="w-8 h-8 mr-3 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium">{token.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{token.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{parseFloat(token.balance).toFixed(4)}</p>
                      {token.usdPrice && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          ${(parseFloat(token.balance) * parseFloat(token.usdPrice)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : loading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading token balances...</p>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p>No token balances found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="nfts" className="p-4">
            <div className="flex justify-end mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleUpdateCollection('nfts')}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
            
            {data?.nfts && data.nfts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.nfts.map((nft, index) => {
                  const metadata = nft.metadata ? 
                    (typeof nft.metadata === 'string' ? JSON.parse(nft.metadata) : nft.metadata) :
                    {};
                    
                  return (
                    <Card key={index} className="overflow-hidden">
                      {metadata.image && (
                        <div className="aspect-square w-full overflow-hidden">
                          <img 
                            src={metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
                            alt={metadata.name || `NFT #${nft.token_id}`}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image';
                            }}
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-medium truncate">
                          {metadata.name || `${nft.name || 'NFT'} #${nft.token_id}`}
                        </h3>
                        <p className="text-sm text-slate-500 truncate mt-1">
                          {nft.token_address.slice(0, 6)}...{nft.token_address.slice(-4)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : loading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading NFTs...</p>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p>No NFTs found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="transactions" className="p-4">
            <div className="flex justify-end mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleUpdateCollection('transactions')}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
            
            {data?.transactions && data.transactions.length > 0 ? (
              <div className="space-y-3">
                {data.transactions.slice(0, 10).map((tx, index) => (
                  <div key={index} className="p-3 rounded-md bg-slate-100 dark:bg-slate-800">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium truncate max-w-[70%]">
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                      </span>
                      <span className="text-sm text-slate-500">
                        {new Date(tx.block_timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>
                        {tx.from_address.toLowerCase() === address.toLowerCase() ? 'Out' : 'In'}:
                        {' '}
                        {tx.from_address.slice(0, 6)}...{tx.from_address.slice(-4)}
                        {' → '}
                        {tx.to_address.slice(0, 6)}...{tx.to_address.slice(-4)}
                      </span>
                      <span className={tx.from_address.toLowerCase() === address.toLowerCase() ? 'text-red-500' : 'text-green-500'}>
                        {parseFloat(tx.value) > 0 
                          ? `${(parseFloat(tx.value) / 1e18).toFixed(6)} ETH` 
                          : tx.receipt_status === "1" ? "Success" : "Failed"}
                      </span>
                    </div>
                  </div>
                ))}
                
                {data.transactions.length > 10 && (
                  <div className="text-center mt-4">
                    <Button variant="outline" size="sm">
                      View More Transactions
                    </Button>
                  </div>
                )}
              </div>
            ) : loading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading transactions...</p>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p>No transactions found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="approvals" className="p-4">
            <div className="flex justify-end mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleUpdateCollection('tokenApprovals')}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
            
            {data?.tokenApprovals && data.tokenApprovals.length > 0 ? (
              <div className="space-y-3">
                {data.tokenApprovals.map((approval, index) => (
                  <div key={index} className="p-3 rounded-md bg-slate-100 dark:bg-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {approval.tokenName || approval.tokenSymbol || 'Token'}
                      </span>
                      <span className={parseInt(approval.allowance) === Number.MAX_SAFE_INTEGER ? "text-red-500" : "text-amber-500"}>
                        {parseInt(approval.allowance) === Number.MAX_SAFE_INTEGER ? "Unlimited" : approval.allowance}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      <span>Approved spender: {approval.spender.slice(0, 8)}...{approval.spender.slice(-6)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : loading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading token approvals...</p>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p>No token approvals found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="portfolio" className="p-4">
            <div className="flex justify-end mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleUpdateCollection('portfolioHistory')}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
            
            {data?.portfolioHistory && data.portfolioHistory.length > 0 ? (
              <div>
                <h3 className="font-medium mb-4">Portfolio Value History</h3>
                <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-md p-4 flex items-center justify-center">
                  {/* We'd implement a chart here using a library like recharts */}
                  <p className="text-slate-500">Portfolio chart would be displayed here</p>
                </div>
                
                <div className="mt-6 space-y-2">
                  {data.portfolioHistory.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between p-2">
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                      <span className="font-medium">${parseFloat(item.value).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : loading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading portfolio history...</p>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p>No portfolio history available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Chain ID: {chainId}</span>
          <span>
            Data Source: {data === cachedData ? 'Firebase Cache' : 'Moralis API'}
          </span>
        </CardFooter>
      </Card>
    </div>
  );
} 