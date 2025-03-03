"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useWalletConnection } from "@/lib/hooks/use-wallet-connection";
import { useEffect, useState } from "react";
import { Progress } from "./ui/progress";

export function WalletConnectionStatus() {
  const {
    isConnected,
    isInitialized,
    walletAddress,
    recentWallets,
    lastConnectedWallet,
    preferredConnectionMethod,
    connectionMetrics,
    formatAddress,
  } = useWalletConnection();

  const [progressValue, setProgressValue] = useState(0);

  // Animate the connection time progress bar
  useEffect(() => {
    if (connectionMetrics.lastConnectionTime) {
      // Calculate a score from 0-100 based on connection time
      // Lower is better: < 500ms is excellent (100), > 5000ms is poor (0)
      const maxTime = 5000; // 5 seconds is considered slow
      const minTime = 500;  // 500ms is considered fast
      
      const rawScore = Math.max(0, 100 - ((connectionMetrics.lastConnectionTime - minTime) / (maxTime - minTime)) * 100);
      const score = Math.min(100, Math.max(0, rawScore));
      
      // Animate the progress
      setProgressValue(0);
      const timer = setTimeout(() => {
        setProgressValue(score);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [connectionMetrics.lastConnectionTime]);

  if (!isInitialized) {
    return null;
  }

  if (!isConnected || !walletAddress) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Wallet Connection</CardTitle>
          <CardDescription>Connect your wallet to view connection metrics</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get the current wallet from recent wallets
  const currentWallet = recentWallets.find(
    w => w.address.toLowerCase() === walletAddress.toLowerCase()
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Wallet Connection</CardTitle>
          <Badge variant={isConnected ? "default" : "outline"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <CardDescription>
          Connection metrics and performance data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Method */}
        <div className="space-y-1">
          <div className="text-sm font-medium">Connection Method</div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {currentWallet?.method || preferredConnectionMethod || "Unknown"}
            </Badge>
          </div>
        </div>

        {/* Connection Time */}
        {connectionMetrics.lastConnectionTime && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Last Connection Time</div>
              <div className="text-sm text-muted-foreground">
                {connectionMetrics.lastConnectionTime}ms
              </div>
            </div>
            <Progress value={progressValue} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Fast</span>
              <span>Slow</span>
            </div>
          </div>
        )}

        {/* Connection Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Connection Attempts</div>
            <div className="text-2xl font-bold">{connectionMetrics.connectionAttempts}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium">Success Rate</div>
            <div className="text-2xl font-bold">
              {connectionMetrics.connectionAttempts > 0
                ? `${Math.round((connectionMetrics.successfulConnections / connectionMetrics.connectionAttempts) * 100)}%`
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Average Connection Time */}
        {connectionMetrics.averageConnectionTime && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Average Connection Time</div>
            <div className="text-2xl font-bold">{Math.round(connectionMetrics.averageConnectionTime)}ms</div>
          </div>
        )}

        {/* Recent Wallets */}
        {recentWallets.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent Wallets</div>
            <div className="space-y-1">
              {recentWallets.slice(0, 3).map((wallet) => (
                <div
                  key={wallet.address}
                  className="flex items-center justify-between rounded-md p-2 text-sm bg-secondary/50"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{formatAddress(wallet.address)}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {wallet.method} • {wallet.avgConnectionTime ? `${Math.round(wallet.avgConnectionTime)}ms` : "No data"}
                    </span>
                  </div>
                  {wallet.address.toLowerCase() === walletAddress.toLowerCase() && (
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 