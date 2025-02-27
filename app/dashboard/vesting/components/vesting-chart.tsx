"use client"

import { useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TimeRange {
  label: string
  value: string
  data: any[]
  description: string
}

const generateUnlockData = (days: number) => {
  const data = []
  const now = new Date()
  const total = 1000000
  let unlocked = 0

  for (let i = 0; i <= days; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
    // More realistic unlock curve with varying rates
    if (i === 0) {
      unlocked = total * 0.1 // Initial unlock (10%)
    } else {
      const dailyUnlock = (total * 0.9) / (365 * 2) // Remaining 90% over 2 years
      unlocked = Math.min(total, unlocked + dailyUnlock)
    }

    data.push({
      date: date.toISOString(),
      unlocked: Math.floor(unlocked),
      total,
      rate: (unlocked / total) * 100,
    })
  }
  return data
}

const timeRanges: TimeRange[] = [
  {
    label: "1D",
    value: "1d",
    data: generateUnlockData(1),
    description: "24-hour unlock schedule",
  },
  {
    label: "1W",
    value: "1w",
    data: generateUnlockData(7),
    description: "7-day token release trend",
  },
  {
    label: "1M",
    value: "1m",
    data: generateUnlockData(30),
    description: "Monthly vesting overview",
  },
  {
    label: "1Y",
    value: "1y",
    data: generateUnlockData(365),
    description: "Yearly vesting projection",
  },
]

export function VestingChart() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>(timeRanges[1])
  const [hoveredPoint, setHoveredPoint] = useState<any>(null)

  const lastDataPoint = selectedRange.data[selectedRange.data.length - 1]
  const totalUnlocked = lastDataPoint?.unlocked || 0
  const unlockProgress = (totalUnlocked / lastDataPoint?.total) * 100

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card/90 to-card/95 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div>
          <CardTitle className="text-base font-medium">Vesting Unlock Schedule</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{selectedRange.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={selectedRange.value === range.value ? "default" : "outline"}
                size="sm"
                className="relative overflow-hidden transition-all duration-300"
                onClick={() => setSelectedRange(range)}
              >
                {range.label}
              </Button>
            ))}
          </div>
          <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/30">
            {unlockProgress.toFixed(2)}% Unlocked
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={selectedRange.data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              onMouseMove={(data) => {
                if (data.activePayload) {
                  setHoveredPoint(data.activePayload[0].payload)
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="unlockGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm border border-border p-3">
                        <div className="text-sm font-medium">{new Date(data.date).toLocaleDateString()}</div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-sm">{data.unlocked.toLocaleString()} NZT Unlocked</span>
                          </div>
                          <div className="text-xs text-muted-foreground pl-4">{data.rate.toFixed(2)}% of total</div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="unlocked"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#unlockGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <AnimatePresence>
          {hoveredPoint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 flex items-center justify-between border-t border-border pt-4"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Unlock Rate</div>
                  <div className="text-lg font-semibold">
                    {(
                      ((hoveredPoint.unlocked -
                        (selectedRange.data[Math.max(0, hoveredPoint.index - 1)]?.unlocked || 0)) /
                        hoveredPoint.total) *
                      100
                    ).toFixed(4)}
                    % per day
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Time to Full Unlock</div>
                  <div className="text-lg font-semibold">
                    {Math.ceil((hoveredPoint.total - hoveredPoint.unlocked) / ((hoveredPoint.total * 0.9) / (365 * 2)))}{" "}
                    days
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(hoveredPoint.unlocked / hoveredPoint.total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {((hoveredPoint.unlocked / hoveredPoint.total) * 100).toFixed(2)}%
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

