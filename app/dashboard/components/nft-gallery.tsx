"use client";

import { useState, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import Image from "next/image";
import { useMoralisData } from "@/lib/hooks/use-moralis-data";
import type { MoralisNFT, NFTAttribute } from "@/lib/hooks/use-moralis-data";
import { SUPPORTED_CHAINS } from "@/lib/hooks/use-moralis-data";
import { 
  Card, 
  CardContent,
  CardFooter 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";

export interface NftGalleryProps {
  allNfts?: MoralisNFT[];
  isLoading?: boolean;
}

// Define metadata structure to avoid implicit any
interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type?: string;
    value?: string | number | Record<string, unknown>;
    display_type?: string;
  }>;
}

// Extend MoralisNFT to include processed properties
interface ProcessedNFT extends MoralisNFT {
  processedImageUrl?: string;
  processedAttributes?: NFTAttribute[];
}

export function NftGallery({ allNfts = [], isLoading = false }: NftGalleryProps) {
  const { address } = useAccount();
  const [activeChain, setActiveChain] = useState<string>("all");
  const [selectedNft, setSelectedNft] = useState<ProcessedNFT | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterChain, setFilterChain] = useState<string | null>(null);
  const [filterCollection, setFilterCollection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch NFT data from multiple chains
  const { allNfts: moralisAllNfts, byChain, isLoading: moralisLoading, error } = useMoralisData({
    enabled: !!address,
  });

  // Process NFTs to handle metadata parsing and image retrieval
  const processNfts = useCallback((nfts: MoralisNFT[]): ProcessedNFT[] => {
    return nfts.map(nft => {
      let parsedMetadata: NFTMetadata | undefined;
      let imageUrl = '';
      let attributes: NFTAttribute[] = [];

      // Try to use normalized metadata first (which is preprocessed by Moralis)
      if (nft.normalized_metadata) {
        imageUrl = nft.normalized_metadata.image || '';
        attributes = nft.normalized_metadata.attributes || [];
      } 
      // Fallback to parsing raw metadata if needed
      else if (nft.metadata) {
        try {
          parsedMetadata = JSON.parse(nft.metadata);
          imageUrl = parsedMetadata?.image || '';
          
          // Normalize attributes if present
          if (parsedMetadata?.attributes) {
            attributes = parsedMetadata.attributes.map((attr: { 
              trait_type?: string; 
              value?: string | number | Record<string, unknown>; 
              display_type?: string;
            }) => ({
              trait_type: attr.trait_type || 'Unknown',
              value: typeof attr.value === 'string' || typeof attr.value === 'number' 
                ? attr.value 
                : JSON.stringify(attr.value || ''),
              display_type: attr.display_type
            }));
          }
        } catch (e) {
          console.error('Error parsing NFT metadata:', e);
        }
      }

      // Fix IPFS URLs
      if (imageUrl?.startsWith('ipfs://')) {
        imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      return {
        ...nft,
        processedImageUrl: imageUrl,
        processedAttributes: attributes
      };
    });
  }, []);

  // Filter NFTs based on the active chain
  const filteredNfts = useMemo(() => {
    const nfts = activeChain === 'all' 
      ? allNfts 
      : byChain[activeChain]?.nfts || [];
    
    return processNfts(nfts);
  }, [allNfts, byChain, activeChain, processNfts]);

  // Get Explorer URL for the NFT
  const getExplorerUrl = useCallback((nft: MoralisNFT) => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === nft.chain);
    const chainName = chain?.name?.toLowerCase() || '';
    
    if (chainName === 'ethereum') {
      return `https://etherscan.io/token/${nft.token_address}?a=${nft.token_id}`;
    }
    
    if (chainName === 'polygon') {
      return `https://polygonscan.com/token/${nft.token_address}?a=${nft.token_id}`;
    }
    
    if (chainName === 'avalanche') {
      return `https://snowtrace.io/token/${nft.token_address}?a=${nft.token_id}`;
    }
    
    if (chainName === 'bsc') {
      return `https://bscscan.com/token/${nft.token_address}?a=${nft.token_id}`;
    }
    
    if (chainName === 'fantom') {
      return `https://ftmscan.com/token/${nft.token_address}?a=${nft.token_id}`;
    }
    
    if (chainName === 'optimism') {
      return `https://optimistic.etherscan.io/token/${nft.token_address}?a=${nft.token_id}`;
    }
    
    if (chainName === 'arbitrum') {
      return `https://arbiscan.io/token/${nft.token_address}?a=${nft.token_id}`;
    }
    
    return '#';
  }, []);

  // Handle NFT click to view details
  const handleNftClick = (nft: ProcessedNFT) => {
    setSelectedNft(nft);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={`w-full`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Using UUID-like strings for skeleton keys */}
          {[
            "skeleton-1a2b3c", 
            "skeleton-4d5e6f", 
            "skeleton-7g8h9i", 
            "skeleton-0j1k2l",
            "skeleton-3m4n5o", 
            "skeleton-6p7q8r", 
            "skeleton-9s0t1u", 
            "skeleton-2v3w4x"
          ].map((id) => (
            <Card key={id} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`w-full`}>
        <Card className="w-full p-8 text-center">
          <p className="text-red-500">Error loading NFTs. Please try again later.</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </Card>
      </div>
    );
  }

  // Render empty state if no NFTs found
  if (filteredNfts.length === 0) {
    return (
      <div className={`w-full`}>
        <Card className="w-full p-8 text-center">
          <p className="text-xl font-semibold mb-2">No NFTs Found</p>
          <p className="text-muted-foreground">
            {activeChain === 'all' 
              ? "Looks like you don't have any NFTs yet." 
              : `No NFTs found on ${SUPPORTED_CHAINS.find(c => c.id === activeChain)?.name || 'selected chain'}.`}
          </p>
          {activeChain !== 'all' && (
            <Button
              variant="outline"
              onClick={() => setActiveChain('all')}
              className="mt-4"
            >
              View all chains
            </Button>
          )}
        </Card>
      </div>
    );
  }

  // Calculate chain counts for tab display
  const chainCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allNfts.length };
    
    for (const chain of SUPPORTED_CHAINS) {
      const nfts = byChain[chain.id]?.nfts || [];
      if (nfts.length > 0) {
        counts[chain.id] = nfts.length;
      }
    }
    
    return counts;
  }, [allNfts.length, byChain]);

  return (
    <div className={`w-full`}>
      {/* Chain selection tabs */}
      <Tabs
        value={activeChain}
        onValueChange={setActiveChain}
        className="w-full mb-6"
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

      {/* NFT grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredNfts.map((nft) => {
          const uniqueKey = `${nft.chain}-${nft.token_address}-${nft.token_id}`;
          return (
            <Card 
              key={uniqueKey} 
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleNftClick(nft)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleNftClick(nft);
                }
              }}
              tabIndex={0}
            >
              <div className="relative aspect-square bg-muted">
                {nft.processedImageUrl ? (
                  <Image
                    src={nft.processedImageUrl}
                    alt={nft.normalized_metadata?.name || nft.name || `NFT #${nft.token_id}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    onError={(e) => {
                      // Set fallback image on error
                      (e.target as HTMLImageElement).src = '/placeholder-nft.png';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <span className="text-muted-foreground">No Image</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">
                  {nft.normalized_metadata?.name || nft.name || `#${nft.token_id}`}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {nft.name || nft.symbol}
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <Badge variant="outline">{nft.chainName}</Badge>
                <Badge variant="secondary">#{nft.token_id}</Badge>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* NFT detail dialog */}
      <Dialog open={!!selectedNft} onOpenChange={(open) => !open && setSelectedNft(null)}>
        {selectedNft && (
          <DialogContent className="sm:max-w-[550px] md:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {selectedNft.normalized_metadata?.name || selectedNft.name || `NFT #${selectedNft.token_id}`}
              </DialogTitle>
              <DialogDescription>
                Collection: {selectedNft.name || 'Unknown'} • Chain: {selectedNft.chainName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                {selectedNft.processedImageUrl ? (
                  <Image
                    src={selectedNft.processedImageUrl}
                    alt={selectedNft.normalized_metadata?.name || selectedNft.name || `NFT #${selectedNft.token_id}`}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-nft.png';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <span className="text-muted-foreground">No Image</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Token ID</h4>
                  <p className="font-mono text-sm break-all">{selectedNft.token_id}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Contract Address</h4>
                  <p className="font-mono text-sm break-all">{selectedNft.token_address}</p>
                </div>
                
                {selectedNft.normalized_metadata?.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                    <p className="text-sm">
                      {selectedNft.normalized_metadata.description.length > 150
                        ? `${selectedNft.normalized_metadata.description.slice(0, 150)}...`
                        : selectedNft.normalized_metadata.description}
                    </p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Blockchain</h4>
                  <Badge variant="outline" className="mr-2">{selectedNft.chainName}</Badge>
                  <Badge variant="secondary">{selectedNft.contract_type || 'ERC-721'}</Badge>
                </div>
              </div>
            </div>
            
            {/* Attributes/Traits */}
            {selectedNft.processedAttributes && selectedNft.processedAttributes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Attributes</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedNft.processedAttributes.map((attr: NFTAttribute) => (
                    <div 
                      key={`${selectedNft.token_id}-${attr.trait_type}-${String(attr.value)}`}
                      className="bg-muted rounded-md p-2"
                    >
                      <span className="text-xs text-muted-foreground block">{attr.trait_type}</span>
                      <span className="font-medium text-sm">{attr.value.toString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <DialogFooter className="mt-4">
              <Button variant="outline">
                <a 
                  href={getExplorerUrl(selectedNft)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 w-full h-full"
                >
                  View on Explorer <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </Button>
              <Button 
                variant="default" 
                onClick={() => setSelectedNft(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
} 