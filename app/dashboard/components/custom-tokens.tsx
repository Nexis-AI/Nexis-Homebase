"use client"

import { Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useWalletData } from "@/lib/hooks/use-wallet-data"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

export function CustomTokens() {
  const { customTokens, removeCustomToken } = useWalletData()
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleRemoveClick = (address: string, symbol: string) => {
    setSelectedToken(address)
    setDialogOpen(true)
  }

  const confirmRemove = () => {
    if (selectedToken) {
      removeCustomToken(selectedToken)
      setDialogOpen(false)
      
      toast({
        title: "Token removed",
        description: "The custom token has been removed from your wallet",
      })
    }
  }

  if (customTokens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom Tokens</CardTitle>
          <CardDescription>You haven't added any custom tokens yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Custom tokens that you add will appear here. You can add custom tokens from the Assets tab.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Tokens</CardTitle>
        <CardDescription>Manage your custom tokens</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-3">
            {customTokens.map((token) => (
              <div key={token.address || token.symbol} className="flex items-center justify-between p-2 rounded-md border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {token.logo ? (
                      <img src={token.logo} alt={token.name} className="h-8 w-8 rounded-full" />
                    ) : (
                      token.symbol.substring(0, 2)
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{token.name}</p>
                    <div className="flex gap-2">
                      <span className="text-sm text-muted-foreground">{token.symbol}</span>
                      {token.address && (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {token.address.substring(0, 6)}...{token.address.substring(token.address.length - 4)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => handleRemoveClick(token.address || token.symbol, token.symbol)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Custom Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this token from your wallet? This action can be undone by adding the token again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="default"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={confirmRemove}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 