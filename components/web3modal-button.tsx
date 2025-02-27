"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { createWeb3Modal, useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';
import { ChevronDown, Wallet, LogOut, Copy, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { wagmiConfig, projectId, featuredWalletIds } from '@/lib/wallet-config';

// Initialize Web3Modal at the module level, outside of any component
if (typeof window !== 'undefined') {
  createWeb3Modal({
    wagmiConfig,
    projectId,
    themeMode: 'dark',
    featuredWalletIds,
    themeVariables: {
      '--w3m-accent': '#3694FF', // Nexis blue color
      '--w3m-border-radius-master': '8px',
    },
  });
}

export function Web3ModalButton() {
  const [mounted, setMounted] = useState(false);
  
  // Only render after component is mounted on client-side
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render anything until client-side
  if (!mounted) {
    return (
      <Button 
        variant="secondary" 
        className="flex items-center gap-2 rounded-lg border border-white/5 px-2 sm:px-3 py-2"
        disabled
      >
        <div className="h-4 w-4 rounded-full bg-secondary animate-pulse" />
        <span className="hidden sm:inline">Loading...</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }
  
  return <WalletConnectContent />;
}

// Separate component to handle wallet connection logic
function WalletConnectContent() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Wallet address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy wallet address");
    }
  };
  
  // Format address to display abbreviated version
  const formatAddress = (addr: string | undefined) => {
    if (!addr) return "Connected";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };
  
  const handleConnect = async () => {
    try {
      await open();
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      disconnect();
      toast.success("Wallet disconnected");
    } catch (error) {
      toast.error("Failed to disconnect wallet");
      console.error(error);
    }
  };
  
  // If not connected, show connect button
  if (!isConnected) {
    return (
      <Button 
        variant="secondary" 
        className="flex items-center gap-2 rounded-lg border border-white/5 px-2 sm:px-3 py-2" 
        onClick={handleConnect}
      >
        <Wallet className="h-4 w-4" />
        <span className="hidden sm:inline">Connect Wallet</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }
  
  // If connected, show wallet info dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="flex items-center gap-2 rounded-lg border border-white/5 px-2 sm:px-3 py-2">
          <div className="h-4 w-4 bg-primary rounded-lg" />
          <span className="hidden sm:inline">{formatAddress(address)}</span>
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
          {address && <div className="truncate font-mono text-xs">{address}</div>}
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