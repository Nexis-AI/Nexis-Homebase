"use client"

import type React from "react"

import { useState } from "react"
import { QrCode, Wallet, Loader2, CheckCircle2, Copy, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SendTokenModalProps {
  isOpen: boolean
  onClose: () => void
  token: {
    symbol: string
    name: string
    balance: number
    price: number
    decimals: number
  }
}

const RECENT_RECIPIENTS = [
  {
    address: "0x1234...5678",
    name: "Personal Wallet",
    lastUsed: "2 days ago",
  },
  {
    address: "0x8765...4321",
    name: "Hardware Wallet",
    lastUsed: "5 days ago",
  },
  {
    address: "0x9876...2468",
    name: "Exchange",
    lastUsed: "1 week ago",
  },
]

const GAS_SPEEDS = [
  { label: "Standard", time: "< 30 sec", fee: "0.001" },
  { label: "Fast", time: "< 15 sec", fee: "0.002" },
  { label: "Instant", time: "< 5 sec", fee: "0.003" },
]

export function SendTokenModal({ isOpen, onClose, token }: SendTokenModalProps) {
  const [step, setStep] = useState<"details" | "confirm" | "processing" | "success">("details")
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [gasSpeed, setGasSpeed] = useState(GAS_SPEEDS[0])
  const [isValidating, setIsValidating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep("confirm")
  }

  const handleConfirm = async () => {
    setStep("processing")
    // Simulate transaction processing
    setTimeout(() => {
      setStep("success")
    }, 2000)
  }

  const resetAndClose = () => {
    setStep("details")
    setRecipient("")
    setAmount("")
    onClose()
  }

  const validateAddress = async (address: string) => {
    setIsValidating(true)
    // Simulate address validation
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsValidating(false)
    return address.startsWith("0x") && address.length === 42
  }

  const maxAmount = token.balance
  const amountUSD = Number(amount) * token.price
  const isValidAmount = Number(amount) > 0 && Number(amount) <= maxAmount

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send {token.symbol}</DialogTitle>
          <DialogDescription>Send tokens to another wallet address.</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "details" && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Balance */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Available Balance</div>
                  <div className="font-medium">
                    {token.balance} {token.symbol}
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">≈ ${(token.balance * token.price).toFixed(2)}</div>
              </div>

              {/* Recipient */}
              <div className="space-y-2">
                <Label>Recipient</Label>
                <div className="relative">
                  <Input
                    placeholder="Enter wallet address (0x...)"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6">
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6">
                      <Wallet className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Recent Recipients */}
                {recipient === "" && (
                  <div className="space-y-2 rounded-lg border p-3">
                    <div className="text-sm font-medium">Recent Recipients</div>
                    <div className="space-y-2">
                      {RECENT_RECIPIENTS.map((r) => (
                        <button
                          key={r.address}
                          type="button"
                          className="flex w-full items-center justify-between rounded-lg p-2 text-sm hover:bg-muted"
                          onClick={() => setRecipient(r.address)}
                        >
                          <div>
                            <div className="font-medium">{r.name}</div>
                            <div className="text-xs text-muted-foreground">{r.address}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{r.lastUsed}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input type="number" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <div className="absolute right-2 top-2 text-sm text-muted-foreground">{token.symbol}</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-[80px]"
                    onClick={() => setAmount(maxAmount.toString())}
                  >
                    Max
                  </Button>
                </div>
                {amount && <div className="text-sm text-muted-foreground">≈ ${amountUSD.toFixed(2)}</div>}
              </div>

              {/* Network Fee */}
              <div className="space-y-2">
                <Label>Network Fee</Label>
                <Select
                  value={gasSpeed.label}
                  onValueChange={(value) =>
                    setGasSpeed(GAS_SPEEDS.find((speed) => speed.label === value) || GAS_SPEEDS[0])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GAS_SPEEDS.map((speed) => (
                      <SelectItem key={speed.label} value={speed.label}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{speed.label}</span>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{speed.time}</span>
                            <span>•</span>
                            <span>
                              {speed.fee} {token.symbol}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={!isValidAmount || !recipient || isValidating}>
                Review Transaction
              </Button>
            </motion.form>
          )}

          {step === "confirm" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">You're sending</span>
                  <div className="text-right">
                    <div className="font-medium">
                      {amount} {token.symbol}
                    </div>
                    <div className="text-sm text-muted-foreground">≈ ${amountUSD.toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">To address</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{recipient}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Network Fee</span>
                  <div className="text-right">
                    <div className="font-medium">
                      {gasSpeed.fee} {token.symbol}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {gasSpeed.label} • {gasSpeed.time}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Amount</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {(Number(amount) + Number(gasSpeed.fee)).toFixed(token.decimals)} {token.symbol}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ≈ ${(amountUSD + Number(gasSpeed.fee) * token.price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("details")}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleConfirm}>
                  Confirm
                </Button>
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <h3 className="mt-4 text-lg font-medium">Processing Transaction</h3>
              <p className="text-sm text-muted-foreground">Please wait while we process your transaction...</p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <h3 className="mt-4 text-lg font-medium">Transaction Successful!</h3>
              <p className="text-center text-sm text-muted-foreground">
                You've successfully sent {amount} {token.symbol} to {recipient}
              </p>
              <Button className="mt-6" onClick={resetAndClose}>
                Close
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

