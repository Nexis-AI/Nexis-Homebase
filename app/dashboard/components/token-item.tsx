"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TokenData } from "@/lib/portfolio-service"

interface TokenItemProps {
  token: TokenData & {
    name: string;
    changePercentage?: number;
    price?: number;
    formattedBalance?: string;
    logoUrl?: string;
  };
  onSend: () => void
  onReceive: () => void
}

export function TokenItem({ token, onSend, onReceive }: TokenItemProps) {
  // Format price with dollar sign and 2 decimal places
  const formattedPrice = token.price !== undefined
    ? `$${token.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "N/A"

  // Format value with dollar sign and 2 decimal places
  const formattedValue = `$${token.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Get the daily change percentage
  const change = token.changePercentage || 0;
  
  // Format balance if not already formatted
  const displayBalance = token.formattedBalance || 
    Number(token.balance).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: token.decimals !== undefined ? (token.decimals > 8 ? 8 : token.decimals) : 2 
    });

  return (
    <div className="flex items-center justify-between py-4 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          {token.logoUrl ? (
            <img src={token.logoUrl} alt={token.name} className="h-10 w-10 rounded-full" />
          ) : (
            token.symbol.substring(0, 2)
          )}
        </div>
        <div>
          <h4 className="font-medium">{token.name}</h4>
          <p className="text-sm text-muted-foreground">{token.symbol}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right mr-4">
          <p className="font-medium">{displayBalance} {token.symbol}</p>
          <div className="text-sm flex items-center gap-1">
            <span>{formattedValue}</span>
            <span className={change >= 0 ? "text-green-500" : "text-red-500"} title="24h change">
              {change >= 0 ? (
                <ArrowUp className="h-3 w-3 inline" />
              ) : (
                <ArrowDown className="h-3 w-3 inline" />
              )}
              {Math.abs(change).toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={onSend}>
            Send
          </Button>
          <Button variant="outline" size="sm" onClick={onReceive}>
            Receive
          </Button>
        </div>
      </div>
    </div>
  )
} 