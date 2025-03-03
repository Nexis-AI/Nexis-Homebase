"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Copy, LogOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useWalletConnection } from "@/lib/hooks/use-wallet-connection";

export function Web3ModalButton() {
  const [mounted, setMounted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Get wallet connection state and functions
  const {
    isConnected,
    isInitialized,
    isLoading,
    isConnecting,
    walletAddress,
    connectionMethod,
    connect,
    disconnect,
    formatAddress
  } = useWalletConnection();
  
  // Only render after component is mounted on client-side
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Function to copy address to clipboard
  const handleCopy = async () => {
    if (!walletAddress) return;
    
    try {
      await navigator.clipboard.writeText(walletAddress);
      setIsCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy address");
    }
  };
  
  // Don't render anything until client-side
  if (!mounted || !isInitialized) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        disabled 
        className="h-9 bg-secondary/50 border border-white/5 flex items-center gap-2"
      >
        <div className="h-4 w-4 rounded-full bg-secondary animate-pulse" />
        <span className="hidden sm:inline">Loading...</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }
  
  // If not connected, show connect button
  if (!isConnected || !walletAddress) {
    return (
      <Button
        onClick={connect}
        variant="outline"
        size="sm"
        disabled={isConnecting || isLoading}
        className={cn(
          "transition-all duration-200 h-9 gap-2",
          isConnecting ? "w-36" : "w-40"
        )}
      >
        {isConnecting ? (
          <>
            <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <span>Connect Wallet</span>
          </>
        )}
      </Button>
    );
  }
  
  // If connected, show wallet info dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-2 flex items-center"
        >
          <div className={cn(
            "h-3 w-3 rounded-full", 
            {
              "bg-blue-400": connectionMethod === 'walletconnect',
              "bg-orange-400": connectionMethod === 'metamask',
              "bg-green-400": connectionMethod === 'web3auth',
              "bg-purple-400": connectionMethod === 'injected',
              "bg-gray-400": connectionMethod === 'unknown' || connectionMethod === 'wagmi'
            }
          )} />
          <span>{formatAddress(walletAddress)}</span>
          <ChevronDown className="h-4 w-4 opacity-70" />
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
            >
              <Copy className={cn("h-4 w-4", isCopied ? "text-green-500" : "")} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground px-2 capitalize">
            {connectionMethod === 'wagmi' ? 'Web3Modal' : connectionMethod} wallet
          </p>
        </div>
        <DropdownMenuItem 
          className="text-destructive focus:text-destructive flex items-center gap-2"
          onClick={disconnect}
        >
          <LogOut className="h-4 w-4" />
          <span>Disconnect Wallet</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 