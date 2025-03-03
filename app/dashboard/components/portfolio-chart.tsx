"use client"

import React, { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import { useAccount } from "wagmi"
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Area,
  XAxis,
  YAxis,
  AreaChart,
  TooltipProps
} from "recharts"
import { usePortfolioCache } from "@/lib/hooks/use-portfolio-cache"
import { cn } from "@/lib/utils"

// Format currency for display
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
};

// Custom tooltip component for the chart
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name: string;
    payload: Record<string, unknown>;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const formattedValue = formatCurrency(value);
    
    // Parse the date from the label
    let date: Date;
    try {
      date = new Date(label || "");
    } catch (e) {
      date = new Date();
    }
    
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
    
    return (
      <div className="bg-background border border-border p-2 rounded-md shadow-md">
        <p className="font-medium">{formattedDate}</p>
        <p className="text-primary font-mono">{formattedValue}</p>
      </div>
    );
  }
  return null;
};

// Time periods for filtering
const TIME_PERIODS = [
  { key: "24h", label: "24H" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "all", label: "ALL" }
]

export function PortfolioChart() {
  const { address } = useAccount()
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"
  const [timePeriod, setTimePeriod] = useState("30d")
  
  // Use our optimized caching hook
  const { data, loading, getPortfolioData } = usePortfolioCache(address)
  
  // Get the data for the current timeframe
  const portfolioData = useMemo(() => 
    data[timePeriod] || null, [data, timePeriod]);
  
  // Load data when timeframe changes
  useEffect(() => {
    if (address) {
      getPortfolioData(timePeriod, 30);
    }
  }, [address, timePeriod, getPortfolioData]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    if (!portfolioData?.history || portfolioData.history.length === 0) {
      return [];
    }
    
    return portfolioData.history.map((item) => {
      // Handle timestamp or date field from API
      const dateStr = item.timestamp ? 
        (typeof item.timestamp === 'number' ? new Date(item.timestamp).toISOString() : item.timestamp) : 
        (item.date || new Date().toISOString());
      
      return {
        date: dateStr,
        value: item.value,
      };
    });
  }, [portfolioData]);
  
  // Calculate change and percentage
  const { initialValue, currentValue, changeAmount, changePercentage } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { initialValue: 0, currentValue: 0, changeAmount: 0, changePercentage: 0 };
    }
    
    const initial = chartData[0]?.value || 0;
    const current = chartData[chartData.length - 1]?.value || 0;
    const change = current - initial;
    const percentage = initial > 0 ? (change / initial) * 100 : 0;
    
    return {
      initialValue: initial,
      currentValue: current,
      changeAmount: change,
      changePercentage: percentage
    };
  }, [chartData]);
  
  // Determine if portfolio change is positive
  const isPositive = changeAmount >= 0;
  
  // Calculate min and max values for chart scaling with padding
  const yDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return [0, 100];
    }
    
    const values = chartData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Add padding of 5% below and above
    const paddingBottom = min * 0.05;
    const paddingTop = max * 0.05;
    
    return [Math.max(0, min - paddingBottom), max + paddingTop];
  }, [chartData]);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Portfolio Value</CardTitle>
            <CardDescription>
              Historical portfolio performance
            </CardDescription>
          </div>
          
          {!loading[timePeriod] && chartData.length > 0 && (
            <Badge 
              variant={isPositive ? "default" : "destructive"}
              className={cn(
                "text-xs px-2 py-1 font-mono",
                isPositive && "bg-green-500/10 text-green-500 hover:bg-green-500/20"
              )}
            >
              {isPositive ? "+" : ""}{changeAmount.toFixed(2)} ({isPositive ? "+" : ""}{changePercentage.toFixed(2)}%)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Time period selector */}
          <div className="flex justify-end">
            <Tabs 
              value={timePeriod} 
              onValueChange={setTimePeriod}
              className="w-auto"
            >
              <TabsList className="grid grid-cols-4 w-auto">
                {TIME_PERIODS.map((period) => (
                  <TabsTrigger 
                    key={period.key} 
                    value={period.key}
                    className="text-xs px-2 py-1"
                  >
                    {period.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          
          {/* Chart section */}
          <div className="w-full h-[280px]">
            {loading[timePeriod] ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="w-full h-full rounded-lg" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="5%" 
                        stopColor={isPositive ? "var(--chart-positive)" : "var(--chart-negative)"} 
                        stopOpacity={0.3} 
                      />
                      <stop 
                        offset="95%" 
                        stopColor={isPositive ? "var(--chart-positive)" : "var(--chart-negative)"} 
                        stopOpacity={0} 
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(dateStr) => {
                      try {
                        const date = new Date(dateStr);
                        return format(date, timePeriod === '24h' ? 'HH:mm' : 'MMM d');
                      } catch (e) {
                        return dateStr;
                      }
                    }}
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                    minTickGap={20}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                    domain={yDomain}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {initialValue > 0 && (
                    <ReferenceLine 
                      y={initialValue} 
                      stroke="var(--muted-foreground)" 
                      strokeDasharray="3 3" 
                      label={{ 
                        value: 'Initial', 
                        position: 'insideBottomRight',
                        fill: 'var(--muted-foreground)',
                        fontSize: 10
                      }} 
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={isPositive ? "var(--chart-positive)" : "var(--chart-negative)"}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    activeDot={{ 
                      r: 6, 
                      stroke: isPositive ? "var(--chart-positive)" : "var(--chart-negative)", 
                      strokeWidth: 2, 
                      fill: 'var(--background)' 
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : address ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No portfolio data available</p>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Connect wallet to view portfolio</p>
              </div>
            )}
          </div>
          
          {/* Current value display */}
          {!loading[timePeriod] && chartData.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">Current Value</p>
              <p className="text-2xl font-bold font-mono">
                {formatCurrency(currentValue)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 