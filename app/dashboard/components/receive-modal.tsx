"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Copy } from "lucide-react";

interface TokenBalance {
  name: string;
  symbol: string;
  balance: number;
  price: number;
  address?: string;
}

interface ReceiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedToken: TokenBalance | null;
}

export function ReceiveModal({
  open,
  onOpenChange,
  selectedToken,
}: ReceiveModalProps) {
  const { address } = useAccount();
  const { toast } = useToast();

  const handleCopyAddress = () => {
    if (!address) return;
    
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const displayAddress = address
    ? `${address.substring(0, 10)}...${address.substring(address.length - 8)}`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Receive Tokens</DialogTitle>
          <DialogDescription>
            Share your wallet address to receive tokens
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {address && (
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={address}
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"L"}
                includeMargin={false}
              />
            </div>
          )}
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md w-full">
            <span className="text-sm font-mono truncate flex-1 px-2">
              {displayAddress}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyAddress}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy address</span>
            </Button>
          </div>
          {selectedToken && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                You are receiving {selectedToken.name} ({selectedToken.symbol})
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Current Balance: {selectedToken.balance.toLocaleString()} {selectedToken.symbol}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 