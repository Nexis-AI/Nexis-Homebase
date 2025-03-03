"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AreaChart, Card as CardShadcn } from "@tremor/react"

interface TokenChartData {
  date: string
  price: number
}

interface TokenChartProps {
  data: TokenChartData[]
  id: string
  symbol: string
  currentPrice: number
  high24h: number
  low24h: number
}

export function TokenChart({ data, id, symbol, currentPrice, high24h, low24h }: TokenChartProps) {
  const [timeRange, setTimeRange] = useState("1D")
  
  // Format currency values
  const formatCurrency = (value: number | undefined) => {
    // Add a null check to handle undefined values
    if (value === undefined || value === null) {
      return "$0.00";
    }
    
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    
    return `$${value.toFixed(2)}`;
  }

  return (
    <div className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-2xl font-bold">{formatCurrency(currentPrice)}</div>
          <div className="text-sm text-muted-foreground">
            24h High: {formatCurrency(high24h)} • 24h Low: {formatCurrency(low24h)}
          </div>
        </div>
        <Tabs defaultValue="1D" className="w-full sm:w-auto" onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="1h">1h</TabsTrigger>
            <TabsTrigger value="1D">1D</TabsTrigger>
            <TabsTrigger value="1W">1W</TabsTrigger>
            <TabsTrigger value="1M">1M</TabsTrigger>
            <TabsTrigger value="1Y">1Y</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="mt-4 h-[300px]">
        <AreaChart
          className="h-full"
          data={data}
          index="date"
          yAxisWidth={60}
          categories={["price"]}
          colors={["blue"]}
          valueFormatter={(value) => formatCurrency(value)}
          showLegend={false}
          showAnimation={true}
          curveType="natural"
          minValue={Math.min(...data.map(d => d.price)) * 0.95}
          maxValue={Math.max(...data.map(d => d.price)) * 1.05}
          showXAxis={true}
          showYAxis={true}
          showGridLines={true}
        />
      </div>
    </div>
  )
}

