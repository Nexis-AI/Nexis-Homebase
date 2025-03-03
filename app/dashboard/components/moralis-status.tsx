"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ANKR_API_KEY } from '@/lib/ankr-config';

// Define interface for moralisStatus
interface MoralisStatusObject {
  status: "loading" | "success" | "error";
  message: string;
}

// Define interface for ANKR RPC status
interface AnkrStatusObject {
  status: "loading" | "success" | "error";
  message: string;
}

// Extend Window interface
declare global {
  interface Window {
    moralisStatus?: MoralisStatusObject;
    ankrStatus?: AnkrStatusObject;
  }
}

interface MoralisStatusProps {
  className?: string;
}

export function MoralisStatus({ className }: MoralisStatusProps) {
  const [moralisStatus, setMoralisStatus] = useState<"loading" | "success" | "error">("loading");
  const [moralisMessage, setMoralisMessage] = useState<string>("");
  const [ankrStatus, setAnkrStatus] = useState<"loading" | "success" | "error">("loading");
  const [ankrMessage, setAnkrMessage] = useState<string>("");
  const [rpcStatus, setRpcStatus] = useState<{
    isConnected: boolean;
    message: string;
  }>({
    isConnected: false,
    message: 'Checking RPC connection...'
  });
  
  // Check Moralis status
  useEffect(() => {
    // Check for moralisStatus in localStorage or window object
    const checkMoralisStatus = async () => {
      try {
        const res = await fetch('/api/status/moralis');
        const data = await res.json();
        if (data.status === 'ok') {
          setMoralisStatus("success");
          setMoralisMessage(`Moralis API connected. Syncing to block ${data.syncedToBlock}`);
        } else {
          setMoralisStatus("error");
          setMoralisMessage(`Moralis API error: ${data.message}`);
        }
      } catch (error) {
        console.error('Error checking Moralis status:', error);
        setMoralisStatus("error");
        setMoralisMessage('Unable to connect to Moralis API');
      }
    };
    
    // Check immediately and then periodically
    checkMoralisStatus();
    const interval = setInterval(checkMoralisStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Check ANKR RPC status
  useEffect(() => {
    const checkAnkrStatus = async () => {
      try {
        const res = await fetch('/api/status/ankr');
        const data = await res.json();
        if (data.status === 'ok') {
          setAnkrStatus("success");
          setAnkrMessage(`ANKR RPC connected. Latest block: ${Number.parseInt(data.result, 16).toLocaleString()}`);
        } else {
          setAnkrStatus("error");
          setAnkrMessage(`ANKR RPC error: ${data.message}`);
        }
      } catch (error) {
        console.error('Error checking ANKR status:', error);
        setAnkrStatus("error");
        setAnkrMessage('Unable to connect to ANKR RPC');
      }
    };
    
    // Check ANKR status immediately and every 30 seconds
    checkAnkrStatus();
    const interval = setInterval(checkAnkrStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Check RPC endpoints directly to monitor health
  useEffect(() => {
    const checkRpcEndpoints = async () => {
      // Prepare a simple eth_blockNumber request
      const body = JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: Date.now()
      });

      try {
        // Try multiple RPC endpoints from our config
        const endpoints = [
          'https://eth.llamarpc.com',
          'https://ethereum.publicnode.com',
          'https://1.rpc.rivet.cloud'
        ];
        
        // Try each endpoint until one works
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body,
              signal: AbortSignal.timeout(3000) // 3 second timeout
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.result) {
                setRpcStatus({
                  isConnected: true,
                  message: `RPC connected via ${new URL(endpoint).hostname}. Block: ${Number.parseInt(data.result, 16).toLocaleString()}`
                });
                return; // Success - exit the loop
              }
            }
          } catch (endpointError) {
            // Just continue to the next endpoint
            console.debug(`RPC endpoint ${endpoint} failed:`, endpointError);
          }
        }
        
        // If we get here, all endpoints failed
        setRpcStatus({
          isConnected: false,
          message: 'All RPC endpoints are unavailable. Please try again later.'
        });
      } catch (error) {
        console.error('Error checking RPC endpoints:', error);
        setRpcStatus({
          isConnected: false,
          message: 'Error checking RPC connectivity'
        });
      }
    };

    // Run all checks
    checkRpcEndpoints();

    // Set up interval to check status periodically
    const intervalId = setInterval(checkRpcEndpoints, 300000); // Check every 5 minutes

    return () => clearInterval(intervalId);
  }, []);
  
  // If no status is found after 10 seconds, show not initialized
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (moralisStatus === "loading" && !moralisMessage) {
        setMoralisStatus("error");
        setMoralisMessage("Moralis initialization status unknown");
      }
      
      if (ankrStatus === "loading" && !ankrMessage) {
        setAnkrStatus("error");
        setAnkrMessage("ANKR RPC status unknown");
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [moralisStatus, moralisMessage, ankrStatus, ankrMessage]);

  if (!moralisMessage && moralisStatus === "loading" && !ankrMessage && ankrStatus === "loading") {
    return null; // Don't show anything during initial loading
  }

  return (
    <div className={className}>
      {/* Moralis Status Alert */}
      <Alert 
        variant={moralisStatus === "error" ? "destructive" : "default"}
        className="border border-dashed mb-2"
      >
        {moralisStatus === "loading" && <AlertCircle className="h-4 w-4" />}
        {moralisStatus === "success" && <CheckCircle className="h-4 w-4" />}
        {moralisStatus === "error" && <XCircle className="h-4 w-4" />}
        <AlertTitle>
          Moralis API {moralisStatus === "success" ? "Connected" : moralisStatus === "error" ? "Error" : "Connecting..."}
        </AlertTitle>
        <AlertDescription>
          {moralisMessage || (moralisStatus === "success" ? "Moralis API connected successfully" : "Checking Moralis API status...")}
        </AlertDescription>
      </Alert>
      
      {/* ANKR RPC Status Alert */}
      <Alert 
        variant={ankrStatus === "error" ? "destructive" : "default"}
        className="border border-dashed"
      >
        {ankrStatus === "loading" && <AlertCircle className="h-4 w-4" />}
        {ankrStatus === "success" && <CheckCircle className="h-4 w-4" />}
        {ankrStatus === "error" && <XCircle className="h-4 w-4" />}
        <AlertTitle>
          ANKR RPC {ankrStatus === "success" ? "Connected" : ankrStatus === "error" ? "Error" : "Connecting..."}
        </AlertTitle>
        <AlertDescription>
          {ankrMessage || (ankrStatus === "success" ? "ANKR RPC connected successfully" : "Checking ANKR RPC status...")}
        </AlertDescription>
      </Alert>
      
      {/* RPC Status Alert */}
      <Alert 
        variant={rpcStatus.isConnected ? "default" : "destructive"}
        className="border border-dashed"
      >
        {rpcStatus.isConnected ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        <AlertTitle>
          RPC Connection
        </AlertTitle>
        <AlertDescription>
          {rpcStatus.message}
        </AlertDescription>
      </Alert>
    </div>
  );
} 