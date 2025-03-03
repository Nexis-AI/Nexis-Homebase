"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getWalletPortfolioHistory } from "@/lib/moralis-client"
import { useAccount } from "wagmi"
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Area,
  XAxis,
  YAxis,
  AreaChart
} from "recharts"
import { useTheme } from "next-themes"
import { useWalletData } from "@/lib/hooks/use-wallet-data"
import { useMoralisData } from "@/lib/hooks/use-moralis-data"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProfitLossData {
  date: string;
  value: number;
}

interface ProfitLossChartProps {
  data?: ProfitLossData[];
  isLoading?: boolean;
}

// Interface for a single data point in the portfolio history
interface PortfolioDataPoint {
  date?: string;
  timestamp?: string | number;
  value: number;
  formattedDate?: string;
  initialValue?: number;
}

// Interface for the portfolio history response
interface PortfolioHistoryData {
  history: PortfolioDataPoint[];
  currentValue: number;
  tokens?: {
    native: {
      symbol: string;
      balance: string;
      value: number;
    };
    tokens: Array<{
      symbol: string;
      balance: string;
      value: number;
    }>;
  };
}

// Define proper types for the tooltip component
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name: string;
    payload: Record<string, unknown>;
  }>;
  label?: string | number;
}

// Use the proper type for the tooltip component
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const formattedValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    
    const date = new Date(label as string);
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
  { key: "7d", label: "7D" },
  { key: "14d", label: "14D" },
  { key: "30d", label: "1M" },
  { key: "90d", label: "3M" },
  { key: "180d", label: "6M" },
  { key: "365d", label: "1Y" },
  { key: "all", label: "All" }
]

export function ProfitLossChart({ data, isLoading = false }: ProfitLossChartProps) {
  const { address } = useAccount()
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"
  const { connectionState } = useWalletData()
  const isConnected = connectionState === 'connected'
  const [timePeriod, setTimePeriod] = useState("30d")
  const [chartData, setChartData] = useState<ProfitLossData[]>(data || [])
  const [loading, setLoading] = useState(isLoading)
  const [selectedPoint, setSelectedPoint] = useState<{date: string, value: number} | null>(null)
  const [initialValue, setInitialValue] = useState(0)
  const [currentValue, setCurrentValue] = useState(0)
  const [totalProfit, setTotalProfit] = useState<number | null>(null)
  const [profitPercentage, setProfitPercentage] = useState<number | null>(null)
  
  // Get data from Moralis hook
  const { getPortfolioHistory } = useMoralisData()
  
  // Calculate days based on selected time period
  const getDays = useCallback(() => {
    switch (timePeriod) {
      case "7d": return 7
      case "14d": return 14
      case "30d": return 30
      case "90d": return 90
      case "180d": return 180
      case "365d": return 365
      case "all": return 1825 // ~5 years
      default: return 30
    }
  }, [timePeriod])
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: timePeriod === "all" || timePeriod === "365d" ? 'numeric' : undefined
    }).format(date)
  }
  
  // Load portfolio data
  useEffect(() => {
    const loadPortfolioData = async () => {
      if (!address || !isConnected) {
        setChartData([]);
        setTotalProfit(null);
        setProfitPercentage(null);
        return;
      }
      
      setLoading(true);
      
      try {
        const portfolioData = await getPortfolioHistory(
          address, 
          getDays(), 
          "0x1"
        );
        
        if (portfolioData?.history && portfolioData.history.length > 0) {
          // Format the data for the chart
          const formattedData = portfolioData.history.map((item: PortfolioDataPoint) => {
            // Handle timestamp or date field from API
            const dateStr = item.timestamp ? 
              (typeof item.timestamp === 'number' ? new Date(item.timestamp).toISOString() : item.timestamp) : 
              (item.date || new Date().toISOString());
            
            const date = new Date(dateStr);
            
            return {
              date: dateStr,
              formattedDate: date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }),
              value: item.value,
              initialValue: portfolioData.history[0].value,
              profit: item.value >= portfolioData.history[0].value ? item.value : null,
              loss: item.value < portfolioData.history[0].value ? item.value : null
            };
          });
          
          setChartData(formattedData);
          
          // Set initial and current values
          const initial = formattedData[0].value;
          const current = formattedData[formattedData.length - 1].value;
          setInitialValue(initial);
          setCurrentValue(current);
          
          // Calculate profit/loss amount
          const profitAmount = current - initial;
          setTotalProfit(profitAmount);
          
          // Calculate profit percentage separately
          const percentage = initial > 0 ? (profitAmount / initial) * 100 : 0;
          setProfitPercentage(percentage);
        } else {
          // Reset on no data
          setChartData([]);
          setInitialValue(0);
          setCurrentValue(0);
          setTotalProfit(null);
          setProfitPercentage(null);
        }
      } catch (error) {
        console.error('Error loading portfolio data:', error);
        setChartData([]);
        setTotalProfit(null);
        setProfitPercentage(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadPortfolioData();
  }, [address, getDays, getPortfolioHistory, isConnected])
  
  // Define gradient colors based on profit/loss
  const isProfitable = totalProfit && totalProfit >= 0
  
  // Generate chart gradient colors based on profit/loss status
  const gradientOffset = useMemo(() => {
    if (chartData.length === 0) return 0
    
    // Find min and max values
    const dataMax = Math.max(...chartData.map(d => d.value))
    const dataMin = Math.min(...chartData.map(d => d.value))
    
    // If all values are positive, offset = 0
    // If all values are negative, offset = 1
    // Otherwise, calculate the offset point
    if (dataMax <= initialValue) return 1
    if (dataMin >= initialValue) return 0
    
    return (initialValue - dataMin) / (dataMax - dataMin)
  }, [chartData, initialValue])
  
  // Format currency for display
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "$0.00"
    
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
    
    return `$${value.toFixed(2)}`
  }
  
  // Format percentage for display
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
  }
  
  // Format date for tooltip
  const formatTooltipDate = (dateStr: string) => {
    try {
      const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
      return format(date, 'MMM d, yy')
    } catch (e) {
      return dateStr
    }
  }

  // Calculate min and max for better Y-axis scaling
  const values = chartData?.map(item => item.value) || [];
  const minValue = values.length > 0 ? Math.min(...values) * 0.95 : 0; // Add 5% padding below
  const maxValue = values.length > 0 ? Math.max(...values) * 1.05 : 100; // Add 5% padding above
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          {/* Header with profit/loss info */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Portfolio Performance</h3>
              {!loading && totalProfit !== null && (
                <div className="flex items-center mt-1">
                  <span className={`text-xl font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                    {isProfitable ? '+' : ''}{totalProfit.toFixed(2)} USD
                  </span>
                  {profitPercentage !== null && (
                    <span className={`ml-2 text-sm ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                      ({isProfitable ? '+' : ''}{profitPercentage.toFixed(2)}%)
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Time period selector */}
            <Tabs value={timePeriod} onValueChange={setTimePeriod} className="w-auto">
              <TabsList className="grid grid-cols-7 h-8">
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
            
          {/* Chart */}
          <div className="w-full h-[280px]">
            {loading ? (
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
                      <stop offset="5%" stopColor={isProfitable ? "var(--green-500)" : "var(--red-500)"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isProfitable ? "var(--green-500)" : "var(--red-500)"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(dateStr) => {
                      const date = new Date(dateStr);
                      return date.toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        ...(timePeriod === '7d' ? { hour: '2-digit' } : {})
                      });
                    }}
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                    minTickGap={20}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                    domain={[minValue, maxValue]}
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
                    stroke={isProfitable ? "var(--green-500)" : "var(--red-500)"}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    activeDot={{ r: 6, stroke: isProfitable ? "var(--green-500)" : "var(--red-500)", strokeWidth: 2, fill: 'var(--background)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No portfolio data available</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 