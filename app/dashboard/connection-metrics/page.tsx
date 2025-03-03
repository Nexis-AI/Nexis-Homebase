"use client";

import { WalletConnectionStatus } from "@/components/wallet-connection-status";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletConnection } from "@/lib/hooks/use-wallet-connection";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart } from "lucide-react";
import { ConnectionTimeChart } from "@/components/connection-time-chart";
import { useState, useEffect } from "react";

export default function ConnectionMetricsPage() {
  const { 
    isConnected, 
    connect, 
    disconnect, 
    connectionMetrics,
    clearConnectionHistory,
    recentWallets
  } = useWalletConnection();

  // Extract connection times from recent wallets for the chart
  const [connectionTimes, setConnectionTimes] = useState<number[]>([]);
  const [connectionLabels, setConnectionLabels] = useState<string[]>([]);

  useEffect(() => {
    // Get connection times from recent wallets and the last connection time
    const times: number[] = [];
    const labels: string[] = [];
    
    // Add the most recent connection time if available
    if (connectionMetrics.lastConnectionTime) {
      times.push(connectionMetrics.lastConnectionTime);
      labels.push('Last');
    }
    
    // Add connection times from recent wallets
    for (const wallet of recentWallets) {
      if (wallet.avgConnectionTime) {
        times.push(wallet.avgConnectionTime);
        labels.push(wallet.method.substring(0, 3));
      }
    }
    
    setConnectionTimes(times);
    setConnectionLabels(labels);
  }, [connectionMetrics.lastConnectionTime, recentWallets]);

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Wallet Connection Metrics</h1>
        <p className="text-muted-foreground">
          Monitor and optimize your wallet connection performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main connection status card */}
        <div className="md:col-span-2">
          <WalletConnectionStatus />
        </div>

        {/* Connection actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Actions</CardTitle>
              <CardDescription>Manage your wallet connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={connect} 
                  disabled={isConnected}
                  className="w-full"
                >
                  Connect
                </Button>
                <Button 
                  onClick={disconnect} 
                  disabled={!isConnected}
                  variant="outline"
                  className="w-full"
                >
                  Disconnect
                </Button>
              </div>
              <Button 
                onClick={clearConnectionHistory} 
                variant="secondary"
                className="w-full"
              >
                Clear History
              </Button>
              <div className="text-xs text-muted-foreground mt-2">
                This will clear all connection history and metrics
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connection Tips</CardTitle>
              <CardDescription>Optimize your wallet experience</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Use the same connection method for faster reconnection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Web3Auth typically provides faster connection times than WalletConnect</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Connection times under 1000ms are considered excellent</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Clear connection history if you experience persistent issues</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance visualization */}
      {isConnected && connectionMetrics.connectionAttempts > 0 && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              <span>Connection History</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Connection Performance Overview</CardTitle>
                <CardDescription>
                  Summary of your wallet connection performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Success Rate</div>
                    <div className="text-3xl font-bold">
                      {Math.round((connectionMetrics.successfulConnections / connectionMetrics.connectionAttempts) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {connectionMetrics.successfulConnections} successful of {connectionMetrics.connectionAttempts} attempts
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Average Connection Time</div>
                    <div className="text-3xl font-bold">
                      {connectionMetrics.averageConnectionTime ? 
                        `${Math.round(connectionMetrics.averageConnectionTime)}ms` : 
                        "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Based on successful connections
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Last Connection</div>
                    <div className="text-3xl font-bold">
                      {connectionMetrics.lastConnectionTime ? 
                        `${connectionMetrics.lastConnectionTime}ms` : 
                        "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {connectionMetrics.lastConnectionTime && connectionMetrics.lastConnectionTime < 1000 ? 
                        "Excellent" : connectionMetrics.lastConnectionTime && connectionMetrics.lastConnectionTime < 3000 ? 
                        "Good" : connectionMetrics.lastConnectionTime ? "Slow" : ""}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <ConnectionTimeChart 
              connectionTimes={connectionTimes}
              labels={connectionLabels}
              title="Connection History"
              description="Detailed history of your recent wallet connections"
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Add a new section for connection process details */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Process Details</CardTitle>
            <CardDescription>
              Technical details about your wallet connection process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Connection Flow</h3>
                <ol className="space-y-2 ml-5 list-decimal">
                  <li className="text-sm">
                    <span className="font-medium">Initialization:</span> Web3Auth provider is initialized with optimized settings
                  </li>
                  <li className="text-sm">
                    <span className="font-medium">Cache Check:</span> System checks for previously connected wallets
                  </li>
                  <li className="text-sm">
                    <span className="font-medium">Connection:</span> Wallet provider is established using preferred method
                  </li>
                  <li className="text-sm">
                    <span className="font-medium">Authentication:</span> Wallet address is verified and session established
                  </li>
                  <li className="text-sm">
                    <span className="font-medium">Caching:</span> Connection details are stored for faster reconnection
                  </li>
                </ol>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Performance Factors</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network Latency</span>
                    <span className="text-sm text-muted-foreground">High Impact</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Browser Extensions</span>
                    <span className="text-sm text-muted-foreground">Medium Impact</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Device Performance</span>
                    <span className="text-sm text-muted-foreground">Medium Impact</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Connection Method</span>
                    <span className="text-sm text-muted-foreground">High Impact</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cache Availability</span>
                    <span className="text-sm text-muted-foreground">High Impact</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-4">Optimization Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <div className="font-medium mb-1">Use Consistent Connection Method</div>
                  <p className="text-sm text-muted-foreground">
                    Using the same connection method improves caching efficiency and reduces connection times.
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="font-medium mb-1">Clear Browser Cache Periodically</div>
                  <p className="text-sm text-muted-foreground">
                    If connection times increase over time, clearing your browser cache may help improve performance.
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="font-medium mb-1">Check Network Connection</div>
                  <p className="text-sm text-muted-foreground">
                    A stable internet connection significantly improves wallet connection reliability and speed.
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="font-medium mb-1">Disable Unused Extensions</div>
                  <p className="text-sm text-muted-foreground">
                    Browser extensions can interfere with wallet connections. Try disabling them if experiencing issues.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 