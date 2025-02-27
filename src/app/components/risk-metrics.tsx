"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RiskMetrics } from "../types"
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

interface RiskMetricsProps {
  metrics: RiskMetrics
}

export function RiskMetricsCard({ metrics }: RiskMetricsProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              className="space-y-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-sm text-muted-foreground">Volatility (30d)</div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{metrics.volatility30d}%</span>
              </div>
            </motion.div>
            <motion.div
              className="space-y-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-sm text-muted-foreground">Market Beta</div>
              <div className="font-medium">{metrics.marketBeta.toFixed(2)}</div>
            </motion.div>
            <motion.div
              className="space-y-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
              <div className="font-medium">{metrics.sharpeRatio.toFixed(2)}</div>
            </motion.div>
            <motion.div
              className="space-y-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-sm text-muted-foreground">Impermanent Loss (30d)</div>
              <div className="flex items-center gap-1 text-red-500">
                <TrendingDown className="h-4 w-4" />
                <span className="font-medium">{metrics.impermanentLoss30d}%</span>
              </div>
            </motion.div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Liquidity Score</div>
            <div className="flex items-center gap-2">
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="absolute h-full bg-gradient-to-r from-yellow-500 to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.liquidityScore}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
                <div className="absolute h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              <span className="text-sm font-medium">{metrics.liquidityScore}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

