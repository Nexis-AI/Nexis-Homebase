"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useWalletConnection } from "@/lib/hooks/use-wallet-connection";

export const WalletConnectButton = () => {
  const {
    isConnected,
    isInitialized,
    isLoading,
    isConnecting,
    walletAddress,
    connect,
    disconnect,
    formatAddress,
    connectionMetrics,
  } = useWalletConnection();

  const [isCopied, setIsCopied] = useState(false);

  // Handle copy wallet address
  const handleCopy = async () => {
    if (!walletAddress) return;
    
    try {
      await navigator.clipboard.writeText(walletAddress);
      setIsCopied(true);
      toast.success("Address copied to clipboard");
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy address", error);
      toast.error("Failed to copy address");
    }
  };

  // If the button is in loading state or Web3Auth is not initialized yet
  if (isLoading || !isInitialized) {
    return (
      <Button variant="outline" size="sm" disabled className="h-9 w-40">
        <Skeleton className="h-5 w-24" />
      </Button>
    );
  }

  // If not authenticated, show connect button
  if (!isConnected || !walletAddress) {
    return (
      <Button
        onClick={connect}
        variant="outline"
        size="sm"
        disabled={isConnecting}
        className={cn(
          "transition-all duration-200 h-9",
          isConnecting ? "w-32" : "w-40"
        )}
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  // If authenticated, show wallet address with dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2"
        >
          <span>{formatAddress(walletAddress)}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-xs text-muted-foreground px-2">Connected Wallet</p>
          <div className="flex items-center justify-between rounded-md p-2 text-sm bg-secondary/50">
            <span className="font-medium">{formatAddress(walletAddress)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
              aria-label="Copy address"
            >
              <Copy className={cn("h-4 w-4", isCopied ? "text-green-500" : "")} />
            </Button>
          </div>
          {connectionMetrics.lastConnectionTime && (
            <p className="text-xs text-muted-foreground px-2">
              Connected in {connectionMetrics.lastConnectionTime}ms
            </p>
          )}
        </div>
        <DropdownMenuItem 
          className="text-destructive focus:text-destructive"
          onClick={disconnect}
        >
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 