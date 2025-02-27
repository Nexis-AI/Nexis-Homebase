"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { StakingTier } from "../types"
import { Clock, Trophy } from "lucide-react"
import { motion } from "framer-motion"

interface StakingTierCardProps {
  tier: StakingTier
  isPopular?: boolean
}

export function StakingTierCard({ tier, isPopular }: StakingTierCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Card className="gradient-border group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {isPopular && (
          <div className="absolute -right-12 top-6 rotate-45 bg-primary px-12 py-1 text-xs font-medium">Popular</div>
        )}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {tier.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-3xl font-bold tracking-tight text-primary">{tier.apy}% APY</div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-4 w-4" />
              {tier.lockPeriod} days lock
            </div>
          </motion.div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimum Stake</span>
              <span className="font-medium">{tier.minimumStake.toLocaleString()} NZT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reward Multiplier</span>
              <span className="font-medium">{tier.multiplier}x</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Rewards</div>
            <div className="space-y-1">
              {tier.rewards.map((reward, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  {reward}
                </motion.div>
              ))}
            </div>
          </div>
          <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
            Stake Now
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

