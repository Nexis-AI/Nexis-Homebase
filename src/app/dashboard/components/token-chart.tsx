"use client"

import { useState } from "react"
import { Area, Bar, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { format } from "date-fns"

interface TokenChartProps {
  data: {
    timestamp: number
    price: number
    volume: number
  }[]
  id: string
  symbol: string
  currentPrice: number
  high24h: number
  low24h: number
}

const TIME_PERIODS = [
  { label: "1H", value: "1h" },
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "1M", value: "1m" },
  { label: "1Y", value: "1y" },
] as const

type TimePeriod = (typeof TIME_PERIODS)[number]["value"]

export function TokenChart({ data, id, symbol, currentPrice, high24h, low24h }: TokenChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("24h")

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toFixed(2)
  }

  // Format timestamp based on time period
  const formatTimestamp = (timestamp: number) => {
    switch (timePeriod) {
      case "1h":
        return format(timestamp, "HH:mm")
      case "24h":
        return format(timestamp, "HH:mm")
      case "7d":
        return format(timestamp, "EEE")
      case "1m":
        return format(timestamp, "MMM dd")
      case "1y":
        return format(timestamp, "MMM yyyy")
      default:
        return format(timestamp, "HH:mm")
    }
  }

  // Calculate price change
  const firstPrice = data[0]?.price || 0
  const priceChange = ((currentPrice - firstPrice) / firstPrice) * 100
  const isPriceUp = priceChange >= 0

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-2xl font-bold">${currentPrice.toLocaleString()}</div>
          <div className={`text-sm ${isPriceUp ? "text-green-500" : "text-red-500"}`}>
            {isPriceUp ? "+" : ""}
            {priceChange.toFixed(2)}%
          </div>
        </div>
        <div className="flex items-center gap-2">
          {TIME_PERIODS.map((period) => (
            <Button
              key={period.value}
              variant={timePeriod === period.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTimePeriod(period.value)}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg border p-3 text-sm">
        <div>
          <span className="text-muted-foreground">24h High</span>
          <div className="font-medium">${high24h.toLocaleString()}</div>
        </div>
        <div>
          <span className="text-muted-foreground">24h Low</span>
          <div className="font-medium">${low24h.toLocaleString()}</div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`hsl(var(--${isPriceUp ? "green" : "red"}-500))`} stopOpacity={0.3} />
                <stop offset="95%" stopColor={`hsl(var(--${isPriceUp ? "green" : "red"}-500))`} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              minTickGap={30}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tickFormatter={(value) => `$${formatNumber(value)}`}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="volume"
              orientation="left"
              tickFormatter={(value) => `$${formatNumber(value)}`}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <div className="mb-2 text-sm text-muted-foreground">{format(data.timestamp, "PPp")}</div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-8">
                          <span className="text-sm text-muted-foreground">Price</span>
                          <span className="font-medium">${data.price.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                          <span className="text-sm text-muted-foreground">Volume</span>
                          <span className="font-medium">${formatNumber(data.volume)}</span>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke={`hsl(var(--${isPriceUp ? "green" : "red"}-500))`}
              strokeWidth={2}
              fill={`url(#gradient-${id})`}
            />
            <Bar yAxisId="volume" dataKey="volume" fill="hsl(var(--muted-foreground))" opacity={0.3} maxBarSize={6} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

