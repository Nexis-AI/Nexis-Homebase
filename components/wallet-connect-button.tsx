"use client";

import { useState, useEffect } from "react";
import { ChevronDown, LogOut, Wallet, Copy, CheckCircle2 } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useWeb3Auth } from "@/lib/web3auth";
import { toast } from "sonner";

export function WalletConnectButton() {
  const { 
    isAuthenticated, 
    isInitialized, 
    isLoading, 
    walletAddress, 
    login, 
    logout 
  } = useWeb3Auth();
  
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    if (!walletAddress) return;
    
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success("Wallet address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy wallet address");
    }
  };
  
  const formatAddress = (address: string | null) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const handleConnect = async () => {
    try {
      await login();
      toast.success("Wallet connected successfully");
    } catch (error) {
      toast.error("Failed to connect wallet");
      console.error(error);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      await logout();
      toast.success("Wallet disconnected");
    } catch (error) {
      toast.error("Failed to disconnect wallet");
      console.error(error);
    }
  };
  
  // Return loading state if Web3Auth is not yet initialized
  if (!isInitialized) {
    return (
      <Button variant="outline" disabled className="flex items-center gap-2 rounded-lg border border-white/5 px-2 sm:px-3 py-2">
        <div className="h-4 w-4 rounded-lg animate-pulse bg-secondary" />
        <span className="hidden sm:inline">Loading...</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }
  
  // If not authenticated, show connect button
  if (!isAuthenticated) {
    return (
      <Button 
        variant="secondary" 
        className="flex items-center gap-2 rounded-lg border border-white/5 px-2 sm:px-3 py-2" 
        onClick={handleConnect}
        disabled={isLoading}
      >
        <Wallet className="h-4 w-4" />
        <span className="hidden sm:inline">{isLoading ? "Connecting..." : "Connect Wallet"}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }
  
  // If authenticated, show wallet info dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="flex items-center gap-2 rounded-lg border border-white/5 px-2 sm:px-3 py-2">
          <div className="h-4 w-4 bg-primary rounded-lg" />
          <span className="hidden sm:inline">{formatAddress(walletAddress)}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground">
          <span>Connected Wallet</span>
        </div>
        <DropdownMenuSeparator />
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Address</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCopy}>
              {copied ? 
                <CheckCircle2 className="h-3 w-3 text-green-500" /> : 
                <Copy className="h-3 w-3" />
              }
            </Button>
          </div>
          <div className="truncate font-mono text-xs">{walletAddress}</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 