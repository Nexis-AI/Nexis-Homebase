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
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface Approval {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  spender: string;
  allowance: number;
  status?: string;
}

interface ApprovalSectionProps {
  approvals: Approval[];
  loading?: boolean;
}

export function ApprovalSection({ approvals, loading = false }: ApprovalSectionProps) {
  const [activeApproval, setActiveApproval] = useState<Approval | null>(null);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const formatSpender = (address: string) => {
    if (!address) return "-";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getRiskBadge = (allowance: number) => {
    if (allowance === Number.POSITIVE_INFINITY || allowance > 1000000) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          High
        </Badge>
      );
    }
    
    if (allowance > 1000) {
      return <Badge variant="secondary" className="text-yellow-500">Medium</Badge>;
    }
    
    return <Badge variant="outline">Low</Badge>;
  };

  const handleRevoke = (approval: Approval) => {
    // In a real app, this would call a smart contract function to revoke the approval
    toast({
      title: "Approval revoke initiated",
      description: `Revoking approval for ${approval.tokenSymbol} to ${formatSpender(approval.spender)}`,
    });

    // Mock successful revoke after 2 seconds
    setTimeout(() => {
      toast({
        title: "Approval revoked",
        description: `Successfully revoked approval for ${approval.tokenSymbol}`,
      });
    }, 2000);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Token</TableHead>
            <TableHead>Spender</TableHead>
            <TableHead>Allowance</TableHead>
            <TableHead>Risk Level</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {approvals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <p>No approvals found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            approvals.map((approval) => (
              <TableRow key={approval.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{approval.tokenName}</div>
                    <div className="text-sm text-muted-foreground">{approval.tokenSymbol}</div>
                  </div>
                </TableCell>
                <TableCell>{formatSpender(approval.spender)}</TableCell>
                <TableCell>
                  {approval.allowance === Number.POSITIVE_INFINITY 
                    ? "Unlimited" 
                    : approval.allowance.toLocaleString(undefined, {
                        maximumFractionDigits: 8,
                      })}{" "}
                  {approval.tokenSymbol}
                </TableCell>
                <TableCell>{getRiskBadge(approval.allowance)}</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Revoke
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Revoke approval for {approval.tokenSymbol}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will revoke the approval for {formatSpender(approval.spender)} to use your {approval.tokenSymbol}. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleRevoke(approval)}
                        >
                          Revoke Approval
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 