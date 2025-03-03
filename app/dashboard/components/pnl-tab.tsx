"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMoralisData } from "@/lib/hooks/use-moralis-data";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart, Bar, Cell } from "recharts";
import { format } from "date-fns";

export function PnLTab() {
  const { portfolioHistory, tokens, isLoading, error } = useMoralisData();

  const formattedHistory = useMemo(() => {
    return portfolioHistory.map(item => ({
      ...item,
      formattedDate: format(new Date(item.date), 'MMM dd')
    }));
  }, [portfolioHistory]);

  // Calculate total portfolio value
  const totalValue = useMemo(() => {
    if (!tokens || tokens.length === 0) return 0;
    
    return tokens.reduce((acc, token) => {
      const balance = Number.parseFloat(token.balance) / (10 ** token.decimals);
      // In a real app, you would include the token price here
      // For now, we'll use a simplified approach
      const price = token.symbol === 'ETH' ? 3000 : 
                    token.symbol === 'BTC' ? 60000 : 
                    token.symbol === 'USDT' ? 1 : 
                    token.symbol === 'USDC' ? 1 : 0.5;
      
      return acc + (balance * price);
    }, 0);
  }, [tokens]);

  // Calculate PnL
  const pnl = useMemo(() => {
    if (portfolioHistory.length < 2) return { value: 0, percentage: 0 };
    
    const oldestValue = portfolioHistory[0].value;
    const latestValue = portfolioHistory[portfolioHistory.length - 1].value;
    const change = latestValue - oldestValue;
    const percentage = (change / oldestValue) * 100;
    
    return {
      value: change,
      percentage,
    };
  }, [portfolioHistory]);

  const isProfitable = pnl.value >= 0;

  // Calculate top performers and underperformers
  const tokenPerformance = useMemo(() => {
    if (!tokens || tokens.length === 0) return [];
    
    // In a real app, you would calculate this based on historical price data
    // For this example, we'll use mock data
    return tokens.slice(0, 5).map(token => {
      const changePercent = (Math.random() * 40) - 20; // Random value between -20% and +20%
      
      return {
        name: token.symbol,
        changePercent,
        isPositive: changePercent > 0,
      };
    }).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  }, [tokens]);

  if (isLoading) {
    return <PnLSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss</CardTitle>
          <CardDescription>Error loading profit and loss data</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Failed to load portfolio data. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Your portfolio performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
              <h3 className="text-2xl font-bold">${totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">30d PnL</p>
              <div className="flex items-center">
                {isProfitable ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                )}
                <h3 className={`text-2xl font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                  {pnl.percentage.toFixed(2)}%
                </h3>
              </div>
              <p className={`text-sm ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                ${Math.abs(pnl.value).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="h-[300px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip 
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Portfolio Value']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Assets with highest gains</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={tokenPerformance.filter(t => t.isPositive).slice(0, 3)} 
                  layout="vertical"
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => {
                      if (typeof value === 'number') {
                        return [`${value.toFixed(2)}%`, 'Change'];
                      }
                      return [`${value}%`, 'Change'];
                    }}
                  />
                  <Bar dataKey="changePercent" fill="#22c55e" radius={[0, 4, 4, 0]}>
                    {tokenPerformance.filter(t => t.isPositive).slice(0, 3).map((token, index) => (
                      <Cell key={`cell-${token.name}-${index}`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Underperformers</CardTitle>
            <CardDescription>Assets with highest losses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={tokenPerformance.filter(t => !t.isPositive).slice(0, 3).map(item => ({
                    ...item,
                    // Convert to positive for visualization
                    changePercent: Math.abs(item.changePercent)
                  }))} 
                  layout="vertical"
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => {
                      if (typeof value === 'number') {
                        return [`-${value.toFixed(2)}%`, 'Change'];
                      }
                      return [`-${value}%`, 'Change'];
                    }}
                  />
                  <Bar dataKey="changePercent" fill="#ef4444" radius={[0, 4, 4, 0]}>
                    {tokenPerformance.filter(t => !t.isPositive).slice(0, 3).map((token, index) => (
                      <Cell key={`cell-neg-${token.name}-${index}`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PnLSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Your portfolio performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
              <Skeleton className="h-8 w-36" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">30d PnL</p>
              <Skeleton className="h-8 w-24 ml-auto" />
              <Skeleton className="h-4 w-16 ml-auto mt-1" />
            </div>
          </div>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Assets with highest gains</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Underperformers</CardTitle>
            <CardDescription>Assets with highest losses</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 