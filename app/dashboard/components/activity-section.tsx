"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle, Clock, XCircle } from "lucide-react";

interface Activity {
  id: string;
  type: string;
  status: string;
  amount: number;
  symbol: string;
  timestamp: number;
  address?: string;
}

interface ActivitySectionProps {
  activities: Activity[];
  loading?: boolean;
}

export function ActivitySection({ activities, loading = false }: ActivitySectionProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === "completed" || statusLower === "success") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (statusLower === "pending" || statusLower === "processing") {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === "completed" || statusLower === "success") {
      return "text-green-500";
    }
    
    if (statusLower === "pending" || statusLower === "processing") {
      return "text-yellow-500";
    }
    
    return "text-red-500";
  };

  const formatAddress = (address: string) => {
    if (!address) return "-";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <p>No transactions found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {activity.type}
                  </Badge>
                </TableCell>
                <TableCell>{activity.symbol}</TableCell>
                <TableCell>
                  {activity.amount.toLocaleString(undefined, {
                    maximumFractionDigits: 8,
                  })}{" "}
                  {activity.symbol}
                </TableCell>
                <TableCell>{formatAddress(activity.address || "")}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(activity.status)}
                    <span className={getStatusColor(activity.status)}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(activity.timestamp).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      window.open(`https://etherscan.io/tx/${activity.id}`, "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View on explorer</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 