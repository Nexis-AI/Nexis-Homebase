// Imported from https://chainid.network/chains_mini.json
export interface ChainData {
    name: string;
    chainId: number;
    shortName: string;
    networkId: number;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpc: string[];
    faucets: string[];
    infoURL: string;
  }
  
  const chains: ChainData[] = [
    {
      name: "Ethereum Mainnet",
      chainId: 1,
      shortName: "eth",
      networkId: 1,
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpc: [
        "https://site1.moralis-nodes.com/eth/0f82b4f6f84240c39e28d22f7354fa00",
        "https://site2.moralis-nodes.com/eth/0f82b4f6f84240c39e28d22f7354fa00",
        "https://api.mycryptoapi.com/eth",
        "https://cloudflare-eth.com",
      ],
      faucets: [],
      infoURL: "https://ethereum.org",
    },