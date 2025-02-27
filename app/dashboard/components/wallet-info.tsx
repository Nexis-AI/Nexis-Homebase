"use client"

import { useState } from "react"
import { Copy, Check, LogOut, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useDisconnect } from "wagmi"
import { useWalletData } from "@/lib/hooks/use-wallet-data"

export function WalletInfo() {
  const { address, ensName } = useWalletData()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  // Format address for display (0x1234...5678)
  const formattedAddress = address 
    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : "Not connected"

  // Create explorer URL for the address
  const explorerUrl = address 
    ? `https://etherscan.io/address/${address}`
    : ""

  const handleCopy = async () => {
    if (!address) return
    
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      })
      
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy address to clipboard",
      })
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  if (!address) {
    return (
      <Card className="md:col-span-1">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-16 text-muted-foreground">
            No wallet connected
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="md:col-span-1">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Connected Wallet</h3>
            <div className="mt-1 flex items-center">
              <span className="font-medium mr-1">
                {ensName || formattedAddress}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(explorerUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={handleDisconnect}
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 