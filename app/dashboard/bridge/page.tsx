"use client"

import { useState } from "react"
import Image from "next/image"
import {
  ArrowDown,
  ArrowRight,
  ExternalLink,
  Info,
  Shield,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  Users,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TokenSelector } from "./components/token-selector"
import { NetworkSelector } from "./components/network-selector"

const supportedNetworks = [
  {
    id: "ethereum",
    name: "Ethereum",
    icon: "/ethereum.svg",
    nativeCurrency: "ETH",
    status: "operational",
    estimatedTime: "15-20 mins",
    gasPrice: "25 gwei",
  },
  {
    id: "bsc",
    name: "BNB Chain",
    icon: "/bnb.svg",
    nativeCurrency: "BNB",
    status: "operational",
    estimatedTime: "5-10 mins",
    gasPrice: "3 gwei",
  },
  {
    id: "base",
    name: "Base",
    icon: "/base.svg",
    nativeCurrency: "ETH",
    status: "operational",
    estimatedTime: "2-5 mins",
    gasPrice: "0.001 gwei",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    icon: "/arbitrum.svg",
    nativeCurrency: "ETH",
    status: "operational",
    estimatedTime: "2-5 mins",
    gasPrice: "0.1 gwei",
  },
  {
    id: "nexis",
    name: "Nexis Network",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/nzt-logo%201-nCuBQ9IAEhNrtKBARrARtdWw2QRQss.png",
    nativeCurrency: "NZT",
    status: "operational",
    estimatedTime: "2-3 mins",
    gasPrice: "0.0001 NZT",
  },
]

const supportedTokens = [
  {
    symbol: "NZT",
    name: "Nexis Token",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/nzt-logo%201-nCuBQ9IAEhNrtKBARrARtdWw2QRQss.png",
    decimals: 18,
    price: 2.45,
    change24h: 5.67,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    icon: "/ethereum.svg",
    decimals: 18,
    price: 3150.75,
    change24h: 2.34,
  },
  {
    symbol: "BNB",
    name: "BNB",
    icon: "/bnb.svg",
    decimals: 18,
    price: 380.25,
    change24h: -1.23,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    icon: "/usdc.svg",
    decimals: 6,
    price: 1.0,
    change24h: 0.01,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    icon: "/usdt.svg",
    decimals: 6,
    price: 1.0,
    change24h: 0.0,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    icon: "/wbtc.svg",
    decimals: 8,
    price: 52150.8,
    change24h: 3.45,
  },
]

const recentTransactions = [
  {
    id: "0x1234...5678",
    fromNetwork: "Ethereum",
    toNetwork: "Nexis Network",
    token: "ETH",
    amount: "1.5",
    status: "completed",
    timestamp: "2024-02-23T12:30:00Z",
    confirmations: "32/32",
  },
  {
    id: "0x8765...4321",
    fromNetwork: "BNB Chain",
    toNetwork: "Nexis Network",
    token: "USDT",
    amount: "1000",
    status: "processing",
    timestamp: "2024-02-23T12:25:00Z",
    confirmations: "15/32",
  },
  {
    id: "0x9876...2468",
    fromNetwork: "Nexis Network",
    toNetwork: "Base",
    token: "NZT",
    amount: "100",
    status: "failed",
    timestamp: "2024-02-23T12:20:00Z",
    confirmations: "0/32",
  },
]

const bridgeStats = {
  totalVolume: "$125.5M",
  totalTransactions: "458.2K",
  activeUsers: "52.3K",
  avgCompletionTime: "8 mins",
  securityScore: "98/100",
  tvl: "$45.2M",
}

export default function BridgePage() {
  const [fromNetwork, setFromNetwork] = useState(supportedNetworks[0])
  const [toNetwork, setToNetwork] = useState(supportedNetworks[4])
  const [selectedToken, setSelectedToken] = useState(supportedTokens[0])
  const [amount, setAmount] = useState("")

  // Estimated values - would come from actual bridge contract
  const estimatedGas = "0.001 ETH"
  const estimatedTime = fromNetwork.estimatedTime
  const bridgeFee = "0.1%"
  const minAmount = "0.01"
  const maxAmount = "1000000"

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500"
      case "processing":
        return "text-yellow-500"
      case "failed":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "processing":
        return <Activity className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Bridge</h1>
        <p className="text-base text-muted-foreground">Transfer tokens across chains</p>
      </div>

      {/* Bridge Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Volume</p>
            </div>
            <p className="text-2xl font-semibold">{bridgeStats.totalVolume}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Transactions</p>
            </div>
            <p className="text-2xl font-semibold">{bridgeStats.totalTransactions}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <p className="text-2xl font-semibold">{bridgeStats.activeUsers}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Avg. Time</p>
            </div>
            <p className="text-2xl font-semibold">{bridgeStats.avgCompletionTime}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Security Score</p>
            </div>
            <p className="text-2xl font-semibold">{bridgeStats.securityScore}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">TVL</p>
            </div>
            <p className="text-2xl font-semibold">{bridgeStats.tvl}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Bridge Assets</CardTitle>
            <CardDescription>Select networks and tokens to bridge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* From Network */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>From</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-muted-foreground">
                    Gas: {fromNetwork.gasPrice}
                  </Badge>
                  <Badge variant="outline" className="text-green-500">
                    {fromNetwork.status}
                  </Badge>
                </div>
              </div>
              <NetworkSelector
                networks={supportedNetworks}
                selected={fromNetwork}
                onSelect={setFromNetwork}
                otherNetwork={toNetwork}
              />
            </div>

            <div className="relative flex justify-center">
              <div className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-full bg-secondary border border-border">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* To Network */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>To</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-muted-foreground">
                    Gas: {toNetwork.gasPrice}
                  </Badge>
                  <Badge variant="outline" className="text-green-500">
                    {toNetwork.status}
                  </Badge>
                </div>
              </div>
              <NetworkSelector
                networks={supportedNetworks}
                selected={toNetwork}
                onSelect={setToNetwork}
                otherNetwork={fromNetwork}
              />
            </div>

            {/* Token and Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Amount</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Min: {minAmount}</span>
                  <span>Max: {maxAmount}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input type="number" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <TokenSelector tokens={supportedTokens} selected={selectedToken} onSelect={setSelectedToken} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Balance: 0.0 {selectedToken.symbol}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    ≈ ${amount ? (Number.parseFloat(amount) * selectedToken.price).toFixed(2) : "0.00"}
                  </span>
                  <button className="text-primary hover:text-primary/90">MAX</button>
                </div>
              </div>
            </div>

            {/* Bridge Info */}
            <div className="rounded-lg border border-border bg-secondary/50 p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-2 text-muted-foreground">
                      <Info className="h-4 w-4" />
                      Estimated Gas Fee
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Gas fee for the transaction on {fromNetwork.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>{estimatedGas}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-2 text-muted-foreground">
                      <Info className="h-4 w-4" />
                      Bridge Fee
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fee charged by the bridge protocol</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>{bridgeFee}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-2 text-muted-foreground">
                      <Info className="h-4 w-4" />
                      Estimated Time
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Average time for the bridge transaction to complete</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>{estimatedTime}</span>
              </div>
            </div>

            {/* Bridge Button */}
            <Button className="w-full" size="lg">
              Bridge Assets
            </Button>

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Bridge secured by Nexis Protocol. View security details</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Recent Transactions */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Track your bridge transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {tx.amount} {tx.token}
                          </span>
                          <span className="text-muted-foreground">
                            {tx.fromNetwork} → {tx.toNetwork}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <a
                            href={`https://etherscan.io/tx/${tx.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/90"
                          >
                            {tx.id}
                          </a>
                          <span className="text-muted-foreground">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(tx.status)}
                            <span className={getStatusColor(tx.status)}>
                              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                            </span>
                          </div>
                          {tx.status === "processing" && (
                            <div className="text-sm text-muted-foreground">{tx.confirmations}</div>
                          )}
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">No recent transactions</div>
              )}
            </CardContent>
          </Card>

          {/* Network Status */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Network Status</CardTitle>
              <CardDescription>Current status of supported networks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {supportedNetworks.map((network) => (
                <div key={network.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="relative h-6 w-6">
                      <Image
                        src={network.icon || "/placeholder.svg"}
                        alt={network.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <div className="font-medium">{network.name}</div>
                      <div className="text-sm text-muted-foreground">Gas: {network.gasPrice}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-500">
                      {network.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">~{network.estimatedTime}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

