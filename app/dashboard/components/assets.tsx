"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TokenItem } from "./token-item"
import { useWalletData } from "@/lib/hooks/use-wallet-data"
import { ReceiveTokenModal } from "./receive-token-modal"
import { SendTokenModal } from "./send-token-modal"
import { AddTokenModal } from "./add-token-modal"

// Define placeholder items for skeleton state
const SKELETON_ITEMS = [
  { id: "skeleton-1" },
  { id: "skeleton-2" },
  { id: "skeleton-3" },
  { id: "skeleton-4" },
  { id: "skeleton-5" }
]

export function Assets() {
  const { tokens, isLoading, addCustomToken, address } = useWalletData()
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
  const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false)

  const handleSendClick = (symbol: string) => {
    setSelectedToken(symbol)
    setIsSendModalOpen(true)
  }

  const handleReceiveClick = (symbol: string) => {
    setSelectedToken(symbol)
    setIsReceiveModalOpen(true)
  }

  const token = selectedToken ? tokens.find((t) => t.token.symbol === selectedToken) : null

  if (isLoading) {
    return (
      <Card className="col-span-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        {SKELETON_ITEMS.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center justify-between py-4 border-b"
            data-testid={item.id}
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </Card>
    )
  }

  return (
    <Card className="col-span-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Assets</h3>
        <Button size="sm" onClick={() => setIsAddTokenModalOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          Add Token
        </Button>
      </div>
      {tokens.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>No assets found</p>
        </div>
      ) : (
        tokens.map((token) => (
          <TokenItem
            key={token.token.symbol}
            token={token}
            onSend={() => handleSendClick(token.token.symbol)}
            onReceive={() => handleReceiveClick(token.token.symbol)}
          />
        ))
      )}

      {token && (
        <>
          <SendTokenModal
            isOpen={isSendModalOpen}
            onClose={() => setIsSendModalOpen(false)}
            token={{
              symbol: token.token.symbol,
              name: token.token.name,
              balance: token.formattedBalance,
              price: token.price,
              decimals: token.token.decimals
            }}
          />
          <ReceiveTokenModal
            isOpen={isReceiveModalOpen}
            onClose={() => setIsReceiveModalOpen(false)}
            token={{
              symbol: token.token.symbol,
              name: token.token.name,
              address: token.token.address
            }}
            walletAddress={address || "0x"}
          />
        </>
      )}

      <AddTokenModal 
        isOpen={isAddTokenModalOpen}
        onClose={() => setIsAddTokenModalOpen(false)}
        onAddToken={addCustomToken}
      />
    </Card>
  )
} 