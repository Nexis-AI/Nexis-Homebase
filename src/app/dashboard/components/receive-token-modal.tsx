"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { QRCodeSVG } from "qrcode.react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Network {
  name: string
  address: string
  explorer: string
}

interface ReceiveTokenModalProps {
  isOpen: boolean
  onClose: () => void
  token: {
    symbol: string
    name: string
    networks?: Network[]
  }
}

export function ReceiveTokenModal({ isOpen, onClose, token }: ReceiveTokenModalProps) {
  // Default to first network or use a fallback if networks is undefined
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(token.networks?.[0] || null)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!selectedNetwork?.address) return

    try {
      await navigator.clipboard.writeText(selectedNetwork.address)
      setCopied(true)
      toast.success("Address copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Failed to copy address")
    }
  }

  // If no networks are available, show a message
  if (!token.networks?.length) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md gap-6 p-6 md:max-w-lg">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-2xl">Receive {token.name}</DialogTitle>
            <DialogDescription>No network information available for this token.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md gap-6 p-6 md:max-w-lg">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl">Receive {token.name}</DialogTitle>
          <DialogDescription>Scan the QR code or copy the address to receive {token.symbol}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Network Selection */}
          {token.networks.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {token.networks.map((network) => (
                <Button
                  key={network.name}
                  variant={selectedNetwork?.name === network.name ? "default" : "outline"}
                  onClick={() => setSelectedNetwork(network)}
                  className={cn(
                    "flex-1 min-w-[120px]",
                    selectedNetwork?.name === network.name && "bg-primary text-primary-foreground",
                  )}
                >
                  {network.name}
                </Button>
              ))}
            </div>
          )}

          {/* QR Code */}
          {selectedNetwork && (
            <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-card/50 to-card/10 p-6">
              <div className="rounded-xl border bg-white p-4 shadow-lg">
                <QRCodeSVG value={selectedNetwork.address} size={200} level="H" includeMargin className="rounded-lg" />
              </div>
            </div>
          )}

          {/* Address Display */}
          {selectedNetwork && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {token.symbol} Address ({selectedNetwork.name})
                </span>
                <a
                  href={selectedNetwork.explorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View on Explorer
                </a>
              </div>
              <div className="flex items-center gap-2 overflow-hidden rounded-lg border bg-muted/50 p-4 backdrop-blur-sm">
                <code className="flex-1 truncate text-sm font-medium">{selectedNetwork.address}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 hover:bg-background/50"
                  onClick={handleCopy}
                >
                  <AnimatePresence initial={false} mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Copy className="h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </div>
          )}

          {/* Warning Message */}
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
            <div className="mb-2 font-medium text-yellow-500">Important:</div>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>
                Only send {token.symbol} to this address on the {selectedNetwork?.name} network
              </li>
              <li>Sending other tokens may result in permanent loss</li>
              <li>Always verify the full address before sending</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

