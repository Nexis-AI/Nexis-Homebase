"use client"

import { useState, useEffect } from "react"
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
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TokenChart } from "./components/token-chart"
import { generateChartData } from "./utils/generate-chart-data"
import { SendTokenModal } from "./components/send-token-modal"
import { ReceiveTokenModal } from "./components/receive-token-modal"
import { WalletInfo } from "./components/wallet-info"
import { CustomTokens } from "./components/custom-tokens"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWalletData } from "@/lib/hooks/use-wallet-data"
import { Skeleton } from "@/components/ui/skeleton"
import { useAccount } from "wagmi"
import { Loader2 } from "lucide-react"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { AlertDialogCancel } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import type { TokenBalance } from "@/lib/hooks/use-wallet-data"

export default function DashboardPage() {
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null)
  const [activeTab, setActiveTab] = useState("assets")
  const { isConnected, address } = useAccount()
  const walletData = useWalletData()
  const { 
    isLoading, 
    portfolio, 
    tokens, 
    transactions, 
    approvals, 
    refetch
  } = walletData
  const [revokeAlertOpen, setRevokeAlertOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Fix hydration issues by only rendering after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

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

  const handleRefresh = async () => {
    await refetch()
  }

  // Return a loading state until client-side rendering is complete
  if (!mounted) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <Skeleton className="h-16 w-16 rounded-full mb-4" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80 mb-6" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    )
  }

  // If not connected, show connect message
  if (!isConnected) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Connect your wallet</h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Connect your wallet to view your portfolio, assets, transactions, and approvals.
          </p>
          <Button 
            variant="default" 
            className="px-8" 
            onClick={() => {
              document.querySelector('[role="button"]')?.dispatchEvent(
                new MouseEvent('click', { bubbles: true })
              )
            }}
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    )
  }

  // Only render the dashboard when mounted and connected
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

        {/* Wallet Info and Portfolio Stats */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
          {/* Wallet Info */}
          <WalletInfo />

          {/* Portfolio Value Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-card/50 to-card/10 backdrop-blur-sm md:col-span-3">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Total Portfolio Value</CardTitle>
                  <CardDescription>Track your portfolio performance</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleRefresh} 
                  disabled={isLoading}
                  className="h-8 w-8"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-48" />
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-4">
                    <div className="text-4xl font-bold tracking-tight">${portfolio.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        portfolio.change24h >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {portfolio.change24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {portfolio.change24h.toFixed(2)}%
                      <span className="text-xs text-muted-foreground">
                        (${Math.abs(portfolio.change24hUSD).toLocaleString(undefined, { maximumFractionDigits: 2 })})
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
                        <div className={`mt-1 text-xl font-semibold ${portfolio.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {portfolio.change24h >= 0 ? "+" : ""}{portfolio.change24h.toFixed(2)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Fiat Value</span>
                        </div>
                        <div className="mt-1 text-xl font-semibold">
                          ${portfolio.fiatValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <BarChart2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">NFT Value</span>
                        </div>
                        <div className="mt-1 text-xl font-semibold">
                          ${portfolio.nftValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Staked</span>
                        </div>
                        <div className="mt-1 text-xl font-semibold">
                          ${portfolio.stakedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

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
            <div className="px-6 py-2">
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
            
            {/* Assets Tab */}
            <TabsContent value="assets">
              <div className="border-t">
                {isLoading ? (
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Asset</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">24h Change</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tokens.map((asset) => (
                        <>
                          <TableRow key={asset.token.address || asset.token.symbol} className="cursor-pointer" onClick={() => toggleAsset(asset.token.address || asset.token.symbol)}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {asset.token.logo && (
                                  <div className="h-8 w-8 rounded-full bg-card overflow-hidden flex-shrink-0">
                                    <img src={asset.token.logo} alt={asset.token.name} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{asset.token.name}</div>
                                  <div className="text-sm text-muted-foreground">{asset.token.symbol}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">${asset.price.toLocaleString(undefined, { maximumFractionDigits: asset.price < 1 ? 6 : 2 })}</TableCell>
                            <TableCell className="text-right">
                              <span className={asset.change24h >= 0 ? "text-green-500" : "text-red-500"}>
                                {asset.change24h >= 0 ? "+" : ""}
                                {asset.change24h.toFixed(2)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(asset.formattedBalance).toLocaleString(undefined, { maximumFractionDigits: 8 })} {asset.token.symbol}
                            </TableCell>
                            <TableCell className="text-right">${asset.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${expandedAsset === (asset.token.address || asset.token.symbol) ? "rotate-180" : ""}`}
                              />
                            </TableCell>
                          </TableRow>
                          {expandedAsset === (asset.token.address || asset.token.symbol) && (
                            <TableRow>
                              <TableCell colSpan={6} className="p-0">
                                <div className="bg-muted/50">
                                  <TokenChart
                                    data={generateChartData(asset.price, 0.002).data}
                                    id={asset.token.symbol.toLowerCase()}
                                    symbol={asset.token.symbol}
                                    currentPrice={asset.price}
                                    high24h={asset.price * 1.1}
                                    low24h={asset.price * 0.9}
                                  />

                                  {/* Asset Details */}
                                  <div className="grid gap-4 border-t p-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                      <span className="text-sm text-muted-foreground">Market Cap</span>
                                      <p className="text-sm font-medium">${asset.marketCap || "N/A"}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-muted-foreground">24h Volume</span>
                                      <p className="text-sm font-medium">${asset.volume24h || "N/A"}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-muted-foreground">Address</span>
                                      <p className="text-sm font-medium truncate">
                                        {asset.token.address ? 
                                          `${asset.token.address.substring(0, 8)}...${asset.token.address.substring(asset.token.address.length - 8)}` : 
                                          "Native Token"}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-muted-foreground">Decimals</span>
                                      <p className="text-sm font-medium">
                                        {asset.token.decimals}
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
                                    {asset.token.address && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          window.open(`https://etherscan.io/token/${asset.token.address}`, '_blank')
                                        }}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        View on Explorer
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
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
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <p>No transactions found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="capitalize">{tx.type}</TableCell>
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
                          <TableCell>{new Date(tx.date).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Approvals Tab */}
            <TabsContent value="approvals">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
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
                    {approvals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <p>No approvals found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      approvals.map((approval) => (
                        <TableRow key={approval.id}>
                          <TableCell className="font-medium">{approval.protocol}</TableCell>
                          <TableCell>{approval.token}</TableCell>
                          <TableCell>{approval.allowance}</TableCell>
                          <TableCell>{approval.lastUsed || "N/A"}</TableCell>
                          <TableCell>{getRiskBadge(approval.risk)}</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog open={revokeAlertOpen} onOpenChange={setRevokeAlertOpen}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                  <AlertCircle className="mr-2 h-4 w-4" />
                                  Revoke
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Revoke approval for {approval.token}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will revoke the approval for {approval.protocol} to use your {approval.token}. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <Button
                                    variant="default"
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => {
                                      // Handle revoke logic here
                                      toast({
                                        title: "Approval revoked",
                                        description: `Successfully revoked approval for ${approval.protocol}`,
                                      });
                                      setRevokeAlertOpen(false);
                                    }}
                                  >
                                    Revoke Approval
                                  </Button>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Custom Tokens Section */}
      <div className="grid gap-6 grid-cols-1">
        <CustomTokens />
      </div>

      {/* Modals */}
      {selectedToken && (
        <>
          <SendTokenModal
            isOpen={sendModalOpen}
            onClose={() => setSendModalOpen(false)}
            token={{
              symbol: selectedToken.token.symbol,
              name: selectedToken.token.name,
              balance: selectedToken.formattedBalance,
              price: selectedToken.price,
              decimals: selectedToken.token.decimals,
            }}
          />
          <ReceiveTokenModal
            isOpen={receiveModalOpen}
            onClose={() => setReceiveModalOpen(false)}
            token={{
              symbol: selectedToken.token.symbol,
              name: selectedToken.token.name,
              address: selectedToken.token.address,
            }}
            walletAddress={address || ""}
          />
        </>
      )}
    </div>
  )
}

