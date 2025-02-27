"use client"

import Image from "next/image"
import { Check } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Token {
  symbol: string
  name: string
  icon: string
  decimals: number
}

interface TokenSelectorProps {
  tokens: Token[]
  selected: Token
  onSelect: (token: Token) => void
}

export function TokenSelector({ tokens, selected, onSelect }: TokenSelectorProps) {
  return (
    <Select
      value={selected.symbol}
      onValueChange={(value) => {
        const token = tokens.find((t) => t.symbol === value)
        if (token) onSelect(token)
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          <div className="flex items-center gap-2">
            <div className="relative h-5 w-5">
              <Image src={selected.icon || "/placeholder.svg"} alt={selected.symbol} fill className="object-contain" />
            </div>
            <span>{selected.symbol}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {tokens.map((token) => (
          <SelectItem key={token.symbol} value={token.symbol} className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative h-5 w-5">
                <Image src={token.icon || "/placeholder.svg"} alt={token.symbol} fill className="object-contain" />
              </div>
              <div className="flex flex-col">
                <span>{token.symbol}</span>
                <span className="text-xs text-muted-foreground">{token.name}</span>
              </div>
            </div>
            {token.symbol === selected.symbol && <Check className="h-4 w-4 text-primary" />}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

