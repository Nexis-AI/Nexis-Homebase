"use client"

import { useState } from "react"
import { Check, Copy, QrCode, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import QRCode from "react-qr-code"

interface ReceiveTokenModalProps {
  isOpen: boolean
  onClose: () => void
  token: {
    symbol: string
    name: string
    address?: string
  }
  walletAddress: string
}

export function ReceiveTokenModal({ isOpen, onClose, token, walletAddress }: ReceiveTokenModalProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      
      toast({
        title: "Address copied",
        description: "Wallet address has been copied to clipboard",
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

  const toggleQR = () => {
    setShowQR(!showQR)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Receive {token.symbol}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Share your wallet address to receive {token.name} ({token.symbol}).
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-6">
          {showQR && (
            <div className="flex flex-col items-center justify-center space-y-4 p-4">
              <div className="p-3 border rounded-lg bg-white">
                <QRCode 
                  value={walletAddress} 
                  size={200}
                  level="H"
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan this QR code to receive {token.symbol}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Your {token.symbol} Address</div>
            <div className="flex gap-2">
              <Input 
                value={walletAddress} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={handleCopy} className="min-w-[4rem]">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={toggleQR}
            >
              <QrCode className="h-4 w-4 mr-2" />
              {showQR ? "Hide QR Code" : "Show QR Code"}
            </Button>
          </div>
          
          {token.address && (
            <div className="space-y-2 border-t pt-4">
              <div className="text-sm font-medium">Token Contract Address</div>
              <div className="flex gap-2">
                <Input 
                  value={token.address} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    await navigator.clipboard.writeText(token.address || "");
                    toast({
                      title: "Contract address copied",
                      description: "Token contract address has been copied to clipboard",
                    });
                  }} 
                  className="min-w-[4rem]"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This is the contract address for {token.name} ({token.symbol}).
              </p>
            </div>
          )}
          
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Important: Only send {token.symbol} to this address. Sending other tokens may result in permanent loss.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

