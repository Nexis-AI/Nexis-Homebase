"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TokenData } from "@/lib/portfolio-service";

// Define the interface for token balances
interface TokenBalance extends TokenData {
  name: string;
  changePercentage: number;
  price: number;
}

interface PortfolioSectionProps {
  balances?: TokenBalance[];
  loading: boolean;
  onSend: (token: TokenBalance) => void;
  onReceive: (token: TokenBalance) => void;
}

export function PortfolioSection({
  balances = [],
  loading,
  onSend,
  onReceive,
}: PortfolioSectionProps) {
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

  const toggleAsset = (assetId: string) => {
    if (expandedAsset === assetId) {
      setExpandedAsset(null);
    } else {
      setExpandedAsset(assetId);
    }
  };

  const {
    address,
    isConnected
  } = useAccount();

  // Calculate total portfolio value
  const totalValue = balances && balances.length > 0
    ? balances.reduce((sum, token) => sum + Number(token.balance) * token.price, 0)
    : 0;

  // Sort tokens by value (highest first)
  const sortedBalances = balances 
    ? [...balances].sort((a, b) => (Number(b.balance) * b.price) - (Number(a.balance) * a.price))
    : [];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-semibold">Total Portfolio Value</h3>
              <p className="text-3xl font-bold">
                ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Assets</h3>
              <p className="text-3xl font-bold">{balances?.length || 0}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">24h Change</h3>
              <p className="text-3xl font-bold text-green-500">
                +$
                {balances && balances.length > 0
                  ? balances
                      .reduce((sum, token) => {
                        const change = (token.changePercentage / 100) * Number(token.balance) * token.price;
                        return sum + change;
                      }, 0)
                      .toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : "0.00"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">24h</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBalances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No assets found
                </TableCell>
              </TableRow>
            ) : (
              sortedBalances.map((token) => (
                <TokenRow
                  key={token.address || token.symbol}
                  token={token}
                  expanded={expandedAsset === (token.address || token.symbol)}
                  onToggle={() => toggleAsset(token.address || token.symbol)}
                  onSend={() => onSend(token)}
                  onReceive={() => onReceive(token)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface TokenRowProps {
  token: TokenBalance;
  expanded: boolean;
  onToggle: () => void;
  onSend: () => void;
  onReceive: () => void;
}

function TokenRow({ token, expanded, onToggle, onSend, onReceive }: TokenRowProps) {
  const value = Number(token.balance) * token.price;

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <TableCell>
          <div className="flex items-center gap-3">
            {/* Token Icon Placeholder */}
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-bold">{token.symbol.slice(0, 2)}</span>
            </div>
            <div>
              <div className="font-medium">{token.name}</div>
              <div className="text-sm text-muted-foreground">{token.symbol}</div>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right">
          ${token.price.toLocaleString(undefined, {
            maximumFractionDigits: token.price < 1 ? 6 : 2,
          })}
        </TableCell>
        <TableCell className="text-right">
          <span
            className={token.changePercentage >= 0 ? "text-green-500" : "text-red-500"}
          >
            {token.changePercentage >= 0 ? "+" : ""}
            {token.changePercentage.toFixed(2)}%
          </span>
        </TableCell>
        <TableCell className="text-right">
          {Number(token.balance).toLocaleString(undefined, {
            maximumFractionDigits: 8,
          })}{" "}
          {token.symbol}
        </TableCell>
        <TableCell className="text-right">
          ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </TableCell>
        <TableCell>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/50 p-4">
            <div className="space-y-4">
              {/* Token Details */}
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <span className="text-sm text-muted-foreground">Address</span>
                  <p className="text-sm font-medium truncate">
                    {token.address
                      ? `${token.address.substring(0, 6)}...${token.address.substring(
                          token.address.length - 4
                        )}`
                      : "Native Token"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Price Change (24h)</span>
                  <p className="text-sm font-medium">
                    <span
                      className={
                        token.changePercentage >= 0 ? "text-green-500" : "text-red-500"
                      }
                    >
                      {token.changePercentage >= 0 ? "+" : ""}
                      {token.changePercentage.toFixed(2)}%
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Balance</span>
                  <p className="text-sm font-medium">
                    {Number(token.balance).toLocaleString(undefined, {
                      maximumFractionDigits: 8,
                    })}{" "}
                    {token.symbol}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Value</span>
                  <p className="text-sm font-medium">
                    ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  onSend();
                }}>
                  Send
                </Button>
                <Button size="sm" variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  onReceive();
                }}>
                  Receive
                </Button>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
} 