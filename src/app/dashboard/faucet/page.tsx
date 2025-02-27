"use client"

import { useState } from "react"
import { Wallet, AlertCircle, CheckCircle2, ArrowRight, History, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock recent requests data
const recentRequests = [
  {
    id: "0x1234...5678",
    address: "0x7654...3210",
    amount: "100 NZT",
    status: "completed",
    timestamp: "2024-02-24 14:30:00",
  },
  {
    id: "0x8765...4321",
    address: "0x9876...5432",
    amount: "100 NZT",
    status: "processing",
    timestamp: "2024-02-24 14:25:00",
  },
  {
    id: "0x5432...1098",
    address: "0x1098...7654",
    amount: "100 NZT",
    status: "failed",
    timestamp: "2024-02-24 14:20:00",
  },
]

export default function FaucetPage() {
  const [address, setAddress] = useState("")
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestStatus, setRequestStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [timeRemaining, setTimeRemaining] = useState(0)

  const handleRequest = async () => {
    if (!address) return

    setIsRequesting(true)
    setRequestStatus("processing")

    // Simulate API request
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setRequestStatus("success")
      setTimeRemaining(24 * 60 * 60) // 24 hours in seconds
    } catch (error) {
      setRequestStatus("error")
    } finally {
      setIsRequesting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

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
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Testnet Faucet</h1>
          <p className="text-base text-muted-foreground">Request test tokens for development</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Request Form */}
        <Card>
          <CardHeader>
            <CardTitle>Request Tokens</CardTitle>
            <CardDescription>Receive 100 NZT tokens for testing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter your wallet address (0x...)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                You can request tokens once every 24 hours per wallet address
              </p>
            </div>

            {requestStatus === "success" && (
              <Alert className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  100 NZT tokens have been sent to your wallet. They should arrive within a few minutes.
                </AlertDescription>
              </Alert>
            )}

            {requestStatus === "error" && (
              <Alert className="bg-destructive/10 text-destructive border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to send tokens. Please check your wallet address and try again.
                </AlertDescription>
              </Alert>
            )}

            {timeRemaining > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Time until next request</span>
                  <span>{formatTime(timeRemaining)}</span>
                </div>
                <Progress value={(timeRemaining / (24 * 60 * 60)) * 100} />
              </div>
            )}

            <Button
              className="w-full gap-2"
              onClick={handleRequest}
              disabled={!address || isRequesting || timeRemaining > 0}
            >
              {isRequesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  Request Tokens
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>About Testnet Tokens</CardTitle>
            <CardDescription>Important information about using test tokens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Test tokens have no real value</AlertTitle>
              <AlertDescription>
                These tokens are for testing purposes only and cannot be traded for real assets.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">Token Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span>Nexis Testnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token</span>
                  <span>NZT (Nexis Test Token)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount per Request</span>
                  <span>100 NZT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cooldown</span>
                  <span>24 hours</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">Getting Started</h3>
              <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
                <li>Connect your wallet to Nexis Testnet</li>
                <li>Enter your wallet address above</li>
                <li>Click "Request Tokens"</li>
                <li>Wait for tokens to arrive (usually within minutes)</li>
                <li>Start testing your dApp!</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Requests</CardTitle>
              <CardDescription>Latest token distribution activity</CardDescription>
            </div>
            <History className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Wallet Address</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.id}</TableCell>
                  <TableCell>{request.address}</TableCell>
                  <TableCell>{request.amount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className={getStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{request.timestamp}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`https://explorer.nexis.network/tx/${request.id}`, "_blank")}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

