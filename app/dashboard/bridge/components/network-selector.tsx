"use client"

import Image from "next/image"
import { Check } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Network {
  id: string
  name: string
  icon: string
  nativeCurrency: string
}

interface NetworkSelectorProps {
  networks: Network[]
  selected: Network
  onSelect: (network: Network) => void
  otherNetwork: Network
}

export function NetworkSelector({ networks, selected, onSelect, otherNetwork }: NetworkSelectorProps) {
  return (
    <Select
      value={selected.id}
      onValueChange={(value) => {
        const network = networks.find((n) => n.id === value)
        if (network) onSelect(network)
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue>
          <div className="flex items-center gap-2">
            <div className="relative h-5 w-5">
              <Image src={selected.icon || "/placeholder.svg"} alt={selected.name} fill className="object-contain" />
            </div>
            <span>{selected.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {networks.map((network) => (
          <SelectItem
            key={network.id}
            value={network.id}
            disabled={network.id === otherNetwork.id}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2 flex-1">
              <div className="relative h-5 w-5">
                <Image src={network.icon || "/placeholder.svg"} alt={network.name} fill className="object-contain" />
              </div>
              <span>{network.name}</span>
            </div>
            {network.id === selected.id && <Check className="h-4 w-4 text-primary" />}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

