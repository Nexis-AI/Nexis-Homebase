"use client"

import { useState } from "react"
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  ChevronDown,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  BarChart2,
  Wallet,
  Check,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TokenChart } from "./components/token-chart"
import { generateChartData } from "./utils/generate-chart-data"
import { SendTokenModal } from "./components/send-token-modal"
import { ReceiveTokenModal } from "./components/receive-token-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for the portfolio
const portfolioValue = 158432.67
const portfolioChange = 12.45
const portfolioChangeAmount = 15234.56

// Mock data for crypto holdings
const cryptoHoldings = [
  {
    id: "nzt",
    name: "Nexis Token",
    symbol: "NZT",
    amount: 25000,
    value: 62500,
    price: 2.5,
    change24h: 5.67,
    marketCap: "250M",
    volume24h: "12.5M",
    circulatingSupply: "100M",
    totalSupply: "200M",
    networks: [
      {
        name: "Nexis Network",
        address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        explorer: "https://explorer.nexis.network",
      },
      {
        name: "Ethereum",
        address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        explorer: "https://etherscan.io",
      },
    ],
    chart: Array.from({ length: 24 }, (_, i) => ({
      time: i,
      value: Math.sin(i / 3) * 10 + 50 + Math.random() * 5,
    })),
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    amount: 15.5,
    value: 48825,
    price: 3150,
    change24h: 2.34,
    marketCap: "380B",
    volume24h: "15.2B",
    circulatingSupply: "120M",
    totalSupply: "120M",
    networks: [],
    chart: Array.from({ length: 24 }, (_, i) => ({
      time: i,
      value: Math.cos(i / 3) * 10 + 50 + Math.random() * 5,
    })),
  },
  {
    id: "bnb",
    name: "BNB",
    symbol: "BNB",
    amount: 100,
    value: 28500,
    price: 285,
    change24h: -1.23,
    marketCap: "44B",
    volume24h: "2.1B",
    circulatingSupply: "155M",
    totalSupply: "200M",
    networks: [],
    chart: Array.from({ length: 24 }, (_, i) => ({
      time: i,
      value: Math.tan(i / 3) * 5 + 50 + Math.random() * 5,
    })),
  },
  {
    id: "wbtc",
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    amount: 0.25,
    value: 11250,
    price: 45000,
    change24h: 3.45,
    marketCap: "850B",
    volume24h: "25.5B",
    circulatingSupply: "19.5M",
    totalSupply: "21M",
    networks: [],
    chart: Array.from({ length: 24 }, (_, i) => ({
      time: i,
      value: Math.sin(i / 2) * 15 + 50 + Math.random() * 5,
    })),
  },
  {
    id: "usdc",
    name: "USD Coin",
    symbol: "USDC",
    amount: 5000,
    value: 5000,
    price: 1,
    change24h: 0.01,
    marketCap: "45B",
    volume24h: "2.8B",
    circulatingSupply: "45B",
    totalSupply: "45B",
    networks: [],
    chart: Array.from({ length: 24 }, (_, i) => ({
      time: i,
      value: 100 + Math.random() * 0.1,
    })),
  },
  {
    id: "usdt",
    name: "Tether USD",
    symbol: "USDT",
    amount: 2500,
    value: 2500,
    price: 1,
    change24h: 0,
    marketCap: "90B",
    volume24h: "50B",
    circulatingSupply: "90B",
    totalSupply: "90B",
    networks: [],
    chart: Array.from({ length: 24 }, (_, i) => ({
      time: i,
      value: 100 + Math.random() * 0.1,
    })),
  },
]

// Add mock data for transactions and approvals
const recentTransactions = [
  {
    id: "0x1234...5678",
    type: "Send",
    token: "NZT",
    amount: "1,000",
    to: "0x8765...4321",
    status: "completed",
    date: "2024-02-24 14:30",
  },
  {
    id: "0x8765...4321",
    type: "Receive",
    token: "ETH",
    amount: "0.5",
    from: "0x9876...2468",
    status: "pending",
    date: "2024-02-24 14:25",
  },
  {
    id: "0x9876...2468",
    type: "Swap",
    token: "USDT → NZT",
    amount: "500",
    status: "completed",
    date: "2024-02-24 14:20",
  },
]

const activeApprovals = [
  {
    id: "0x1234...5678",
    protocol: "NexSwap",
    token: "NZT",
    allowance: "Unlimited",
    lastUsed: "2024-02-24",
    risk: "high",
  },
  {
    id: "0x8765...4321",
    protocol: "NexStake",
    token: "ETH",
    allowance: "1,000",
    lastUsed: "2024-02-23",
    risk: "medium",
  },
  {
    id: "0x9876...2468",
    protocol: "NexBridge",
    token: "USDT",
    allowance: "10,000",
    lastUsed: "2024-02-22",
    risk: "low",
  },
]

export default function DashboardPage() {
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("assets")

  const toggleAsset = (assetId: string) => {
    setExpandedAsset(expandedAsset === assetId ? null : assetId)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-green-500"
      case "pending":
        return "text-yellow-500"
      case "failed":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "high":
        return <span className="rounded-full bg-red-500/10 text-red-500 px-2 py-1 text-xs">High Risk</span>
      case "medium":
        return <span className="rounded-full bg-yellow-500/10 text-yellow-500 px-2 py-1 text-xs">Medium Risk</span>
      case "low":
        return <span className="rounded-full bg-green-500/10 text-green-500 px-2 py-1 text-xs">Low Risk</span>
      default:
        return null
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Portfolio Overview */}
      <div className="grid gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
            <p className="text-base text-muted-foreground">Manage your crypto assets</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Send
            </Button>
            <Button className="gap-2">
              <ArrowDownLeft className="h-4 w-4" />
              Receive
            </Button>
            <Button className="gap-2">
              <CreditCard className="h-4 w-4" />
              Buy Crypto
            </Button>
          </div>
        </div>

        {/* Portfolio Value Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-card/50 to-card/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Total Portfolio Value</CardTitle>
            <CardDescription>Track your portfolio performance</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-baseline gap-4">
              <div className="text-4xl font-bold tracking-tight">${portfolioValue.toLocaleString()}</div>
              <div
                className={`flex items-center gap-1 text-sm ${
                  portfolioChange >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {portfolioChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {portfolioChange}%
                <span className="text-xs text-muted-foreground">
                  (${Math.abs(portfolioChangeAmount).toLocaleString()})
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">24h Change</span>
                  </div>
                  <div className="mt-1 text-xl font-semibold">+5.2%</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Fiat Value</span>
                  </div>
                  <div className="mt-1 text-xl font-semibold">$125.5K</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">NFT Value</span>
                  </div>
                  <div className="mt-1 text-xl font-semibold">$28.2K</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Staked</span>
                  </div>
                  <div className="mt-1 text-xl font-semibold">$4.8K</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Tabs and Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Portfolio Activity</CardTitle>
                <CardDescription>Manage your assets and activity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <Tabs defaultValue="assets" className="w-full">
            <div className="px-6 border-b">
              <TabsList className="w-full sm:w-[400px]">
                <TabsTrigger value="assets" className="flex-1">
                  Assets
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex-1">
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="approvals" className="flex-1">
                  Approvals
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="assets">
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Asset</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">24h Change</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cryptoHoldings.map((asset) => (
                      <>
                        <TableRow key={asset.id} className="cursor-pointer" onClick={() => toggleAsset(asset.id)}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{asset.name}</span>
                              <span className="text-sm text-muted-foreground">{asset.symbol}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">${asset.price.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <span className={asset.change24h >= 0 ? "text-green-500" : "text-red-500"}>
                              {asset.change24h >= 0 ? "+" : ""}
                              {asset.change24h}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {asset.amount.toLocaleString()} {asset.symbol}
                          </TableCell>
                          <TableCell className="text-right">${asset.value.toLocaleString()}</TableCell>
                          <TableCell>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${expandedAsset === asset.id ? "rotate-180" : ""}`}
                            />
                          </TableCell>
                        </TableRow>
                        {expandedAsset === asset.id && (
                          <TableRow>
                            <TableCell colSpan={6} className="p-0">
                              <div className="bg-muted/50">
                                <TokenChart
                                  data={generateChartData(asset.price, 0.002).data}
                                  id={asset.id}
                                  symbol={asset.symbol}
                                  currentPrice={asset.price}
                                  high24h={asset.price * 1.1}
                                  low24h={asset.price * 0.9}
                                />

                                {/* Asset Details */}
                                <div className="grid gap-4 border-t p-4 sm:grid-cols-2 lg:grid-cols-4">
                                  <div>
                                    <span className="text-sm text-muted-foreground">Market Cap</span>
                                    <p className="text-sm font-medium">${asset.marketCap}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-muted-foreground">24h Volume</span>
                                    <p className="text-sm font-medium">${asset.volume24h}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-muted-foreground">Circulating Supply</span>
                                    <p className="text-sm font-medium">
                                      {asset.circulatingSupply} {asset.symbol}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-muted-foreground">Total Supply</span>
                                    <p className="text-sm font-medium">
                                      {asset.totalSupply} {asset.symbol}
                                    </p>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 border-t p-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedToken(asset)
                                      setSendModalOpen(true)
                                    }}
                                  >
                                    <ArrowUpRight className="h-4 w-4" />
                                    Send
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedToken(asset)
                                      setReceiveModalOpen(true)
                                    }}
                                  >
                                    <ArrowDownLeft className="h-4 w-4" />
                                    Receive
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    View on Explorer
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="transactions">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>To/From</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.type}</TableCell>
                      <TableCell>{tx.token}</TableCell>
                      <TableCell>{tx.amount}</TableCell>
                      <TableCell>{tx.to || tx.from || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {tx.status === "completed" ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : tx.status === "pending" ? (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className={getStatusColor(tx.status)}>
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="approvals">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Allowance</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeApprovals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell className="font-medium">{approval.protocol}</TableCell>
                      <TableCell>{approval.token}</TableCell>
                      <TableCell>{approval.allowance}</TableCell>
                      <TableCell>{approval.lastUsed}</TableCell>
                      <TableCell>{getRiskBadge(approval.risk)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm">
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Keep existing modals */}
      {selectedToken && (
        <SendTokenModal
          isOpen={sendModalOpen}
          onClose={() => setSendModalOpen(false)}
          token={{
            symbol: selectedToken.symbol,
            name: selectedToken.name,
            balance: selectedToken.amount,
            price: selectedToken.price,
            decimals: 18,
          }}
        />
      )}
      {selectedToken && (
        <ReceiveTokenModal
          isOpen={receiveModalOpen}
          onClose={() => setReceiveModalOpen(false)}
          token={{
            symbol: selectedToken.symbol,
            name: selectedToken.name,
            networks: selectedToken.networks,
          }}
        />
      )}
    </div>
  )
}

