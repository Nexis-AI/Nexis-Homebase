"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Info, TrendingUp, Lock, Timer, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import styles from "../styles.module.css"

interface WithdrawRestakeProps {
  availableAmount: number
  earlyStakerSpotsLeft: number
}

export function WithdrawRestake({ availableAmount, earlyStakerSpotsLeft }: WithdrawRestakeProps) {
  const [amount, setAmount] = useState("")
  const [action, setAction] = useState<"withdraw" | "restake">("withdraw")
  const [estimatedRewards, setEstimatedRewards] = useState<number>(0)
  const [showRewardSimulation, setShowRewardSimulation] = useState(false)

  const maxAmount = availableAmount
  const earlyStakerProgress = ((300 - earlyStakerSpotsLeft) / 300) * 100
  const baseAPY = 80 // Base APY for regular stakers
  const bonusAPY = 200 // Early staker bonus APY
  const isEarlyStaker = earlyStakerSpotsLeft > 0

  useEffect(() => {
    const amountNum = Number(amount) || 0
    const apy = isEarlyStaker ? bonusAPY : baseAPY
    const yearlyReward = (amountNum * apy) / 100
    setEstimatedRewards(yearlyReward)
  }, [amount, isEarlyStaker])

  const rewardPeriods = [
    { label: "Daily", value: estimatedRewards / 365 },
    { label: "Weekly", value: estimatedRewards / 52 },
    { label: "Monthly", value: estimatedRewards / 12 },
    { label: "Yearly", value: estimatedRewards },
  ]

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card/90 to-card/95 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Withdraw or Restake</CardTitle>
            <CardDescription>Choose what to do with your unlocked tokens</CardDescription>
          </div>
          {isEarlyStaker && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-full px-4 py-1.5 bg-primary/10 border border-primary/30"
            >
              <span className="text-primary">Early Staker Bonus Available!</span>
            </motion.div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Available Amount</Label>
            <div className="text-2xl font-bold">{availableAmount.toLocaleString()} NZT</div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Wallet className="h-3 w-3" />
              Balance
            </Badge>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <TrendingUp className="h-3 w-3 mr-1" />
              {isEarlyStaker ? "200%" : "80%"} APY
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Early Staker Spots</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className={`h-4 w-4 ${styles.infoIcon}`} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>First 300 stakers receive 200% APY for the first year</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm text-muted-foreground">{earlyStakerSpotsLeft} remaining</span>
          </div>
          <div className={styles.progressTrack}>
            <motion.div
              className={styles.progressBar}
              initial={{ width: 0 }}
              animate={{ width: `${earlyStakerProgress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {earlyStakerSpotsLeft > 0
              ? `Be one of the ${earlyStakerSpotsLeft} early stakers to receive 200% APY`
              : "Early staker spots have been filled"}
          </p>
        </div>

        <Tabs value={action} onValueChange={(v) => setAction(v as "withdraw" | "restake")}>
          <TabsList className={`grid w-full grid-cols-2 ${styles.tabsList}`}>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="restake">Restake</TabsTrigger>
          </TabsList>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className={`flex gap-2 ${styles.inputWrapper}`}>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setShowRewardSimulation(action === "restake" && Number(e.target.value) > 0)
                  }}
                />
                <Button
                  variant="outline"
                  className="w-[80px]"
                  onClick={() => {
                    setAmount(maxAmount.toString())
                    setShowRewardSimulation(action === "restake")
                  }}
                >
                  Max
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {action === "withdraw" ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-border bg-card/50 p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Info className={`h-4 w-4 ${styles.infoIcon}`} />
                      <span className="text-muted-foreground">Network Fee</span>
                    </div>
                    <span>~0.001 NZT</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-lg border border-border bg-card/50 p-3 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`h-4 w-4 ${styles.infoIcon}`} />
                        <span className="text-muted-foreground">Staking APY</span>
                      </div>
                      <Badge variant="outline" className={`${styles.apyBadge} border-primary/50`}>
                        {isEarlyStaker ? "200%" : "80%"} APY
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Lock className={`h-4 w-4 ${styles.infoIcon}`} />
                        <span className="text-muted-foreground">Lock Period</span>
                      </div>
                      <span>365 days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Timer className={`h-4 w-4 ${styles.infoIcon}`} />
                        <span className="text-muted-foreground">Rewards Start</span>
                      </div>
                      <span>Next Epoch (~2 hours)</span>
                    </div>
                  </div>

                  {showRewardSimulation && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="rounded-lg border border-border bg-card/50 p-3"
                    >
                      <h4 className="text-sm font-medium mb-3">Estimated Rewards</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {rewardPeriods.map((period) => (
                          <div key={period.label} className="space-y-1">
                            <div className="text-xs text-muted-foreground">{period.label}</div>
                            <div className="text-sm font-medium">
                              {period.value.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              NZT
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <Button className="w-full relative overflow-hidden group" size="lg">
              <span className="relative z-10">
                {action === "withdraw" ? "Withdraw to Wallet" : "Restake for Higher Yields"}
              </span>
              <ArrowRight className="relative z-10 ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

