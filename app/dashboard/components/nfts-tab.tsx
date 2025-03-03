"use client";

import { useMoralisData } from "@/lib/hooks/use-moralis-data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import Image from "next/image";

export function NFTsTab() {
  const { nfts, isLoading, error } = useMoralisData();
  const [activeView, setActiveView] = useState<string>("grid");

  // Group NFTs by collection
  const nftsByCollection = nfts.reduce<Record<string, typeof nfts>>((acc, nft) => {
    const collectionKey = `${nft.token_address}_${nft.symbol}`;
    
    if (!acc[collectionKey]) {
      acc[collectionKey] = [];
    }
    
    acc[collectionKey].push(nft);
    return acc;
  }, {});

  const collections = Object.keys(nftsByCollection).map(key => {
    const firstNft = nftsByCollection[key][0];
    return {
      name: firstNft.name || firstNft.symbol,
      symbol: firstNft.symbol,
      count: nftsByCollection[key].length,
      address: firstNft.token_address,
      nfts: nftsByCollection[key]
    };
  });

  if (isLoading) {
    return <NFTsSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NFTs</CardTitle>
          <CardDescription>Error loading NFT data</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Failed to load NFT data. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  if (nfts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NFTs</CardTitle>
          <CardDescription>Your NFT collections</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10">
          <h3 className="text-xl font-medium mb-2">No NFTs Found</h3>
          <p className="text-muted-foreground">
            Connect your wallet or switch to a different wallet to view your NFTs
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">NFT Collections</h2>
          <p className="text-muted-foreground">
            {collections.length} collection{collections.length !== 1 ? 's' : ''}, {nfts.length} NFT{nfts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Tabs value={activeView} onValueChange={setActiveView} className="w-[200px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <TabsContent value="grid" className="mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {nfts.map((nft) => {
            const metadata = nft.normalized_metadata;
            const imageUrl = metadata?.image || '/placeholder-nft.png';
            const name = metadata?.name || `${nft.name || nft.symbol} #${nft.token_id}`;
            
            return (
              <Card key={`${nft.token_address}-${nft.token_id}`} className="overflow-hidden">
                <div className="relative aspect-square bg-black/10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={name}
                        className="object-cover"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="text-muted-foreground">No Image</div>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium truncate" title={name}>
                    {name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {nft.symbol}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="list" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>NFT Collections</CardTitle>
            <CardDescription>Your NFT collections by contract</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {collections.map((collection) => (
                <Card key={collection.address}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{collection.name}</CardTitle>
                        <CardDescription>{collection.symbol}</CardDescription>
                      </div>
                      <Badge>{collection.count} NFT{collection.count !== 1 ? 's' : ''}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex overflow-x-auto space-x-4 pb-2">
                      {collection.nfts.slice(0, 5).map((nft) => {
                        const metadata = nft.normalized_metadata;
                        const imageUrl = metadata?.image || '/placeholder-nft.png';
                        
                        return (
                          <div 
                            key={`${nft.token_address}-${nft.token_id}`} 
                            className="relative w-24 h-24 flex-shrink-0"
                          >
                            <div className="absolute inset-0 rounded-md overflow-hidden">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={nft.token_id}
                                  className="object-cover"
                                  fill
                                  sizes="96px"
                                />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full bg-black/10 text-xs text-muted-foreground">
                                  No Image
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {collection.count > 5 && (
                        <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center border border-dashed rounded-md">
                          <span className="text-sm text-muted-foreground">+{collection.count - 5} more</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">View Collection</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  );
}

function NFTsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-[200px]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => {
          const uniqueKey = `skeleton-nft-${i}-${Date.now()}`;
          return (
            <Card key={uniqueKey} className="overflow-hidden">
              <Skeleton className="aspect-square" />
              <CardContent className="p-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 