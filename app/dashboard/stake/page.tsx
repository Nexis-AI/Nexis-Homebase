"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronDown, Info, Users, Clock, Activity, Shield, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Validator {
  id: string
  name: string
  icon: string
  apy: number
  uptime: number
  totalStaked: number
  selfStaked: number
  delegators: number
  commission: number
  status: "active" | "inactive"
  description: string
  website: string
  identity: string
}

const validators: Validator[] = [
  {
    id: "val1",
    name: "Nexis Foundation",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/nzt-logo%201-nCuBQ9IAEhNrtKBARrARtdWw2QRQss.png",
    apy: 15.5,
    uptime: 99.99,
    totalStaked: 2500000,
    selfStaked: 500000,
    delegators: 1250,
    commission: 5,
    status: "active",
    description: "Official Nexis Foundation validator node",
    website: "https://nexis.network",
    identity: "0x1234...5678",
  },
  {
    id: "val2",
    name: "StakeWise",
    icon: "/placeholder.svg",
    apy: 14.8,
    uptime: 99.95,
    totalStaked: 1800000,
    selfStaked: 400000,
    delegators: 850,
    commission: 7,
    status: "active",
    description: "Professional staking provider with 24/7 monitoring",
    website: "https://stakewise.io",
    identity: "0x8765...4321",
  },
  {
    id: "val3",
    name: "NodeKeepers",
    icon: "/placeholder.svg",
    apy: 14.2,
    uptime: 99.9,
    totalStaked: 1200000,
    selfStaked: 300000,
    delegators: 620,
    commission: 8,
    status: "active",
    description: "Secure and reliable validator service",
    website: "https://nodekeepers.io",
    identity: "0x9876...2468",
  },
]

const stakingStats = {
  totalStaked: "45.5M NZT",
  activeValidators: "100",
  averageAPY: "14.8%",
  stakingRatio: "45.5%",
  minimumStake: "100 NZT",
  unbondingPeriod: "14 days",
}

export default function StakePage() {
  const [expandedValidator, setExpandedValidator] = useState<string | null>(null)
  const [stakeAmount, setStakeAmount] = useState("")

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Stake</h1>
        <p className="text-base text-muted-foreground">Stake your NZT tokens with validators</p>
      </div>

      {/* Staking Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Staked</p>
            </div>
            <p className="text-2xl font-semibold">{stakingStats.totalStaked}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Active Validators</p>
            </div>
            <p className="text-2xl font-semibold">{stakingStats.activeValidators}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Average APY</p>
            </div>
            <p className="text-2xl font-semibold">{stakingStats.averageAPY}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Staking Ratio</p>
            </div>
            <p className="text-2xl font-semibold">{stakingStats.stakingRatio}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Minimum Stake</p>
            </div>
            <p className="text-2xl font-semibold">{stakingStats.minimumStake}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Unbonding Period</p>
            </div>
            <p className="text-2xl font-semibold">{stakingStats.unbondingPeriod}</p>
          </CardContent>
        </Card>
      </div>

      {/* Validator List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Validators</CardTitle>
          <CardDescription>Choose a validator to stake with</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Validator</TableHead>
                <TableHead className="text-right">APY</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Total Staked</TableHead>
                <TableHead className="text-right">Delegators</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validators.map((validator) => (
                <>
                  <TableRow
                    key={validator.id}
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => setExpandedValidator(expandedValidator === validator.id ? null : validator.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8 rounded-full overflow-hidden">
                          <Image
                            src={validator.icon || "/placeholder.svg"}
                            alt={validator.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{validator.name}</div>
                          <div className="text-sm text-muted-foreground">Uptime: {validator.uptime}%</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-500">{validator.apy}%</span>
                    </TableCell>
                    <TableCell className="text-right">{validator.commission}%</TableCell>
                    <TableCell className="text-right">{(validator.totalStaked / 1000000).toFixed(1)}M NZT</TableCell>
                    <TableCell className="text-right">{validator.delegators}</TableCell>
                    <TableCell className="text-right">
                      {validator.status === "active" ? (
                        <Badge variant="outline" className="text-green-500">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-500">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          expandedValidator === validator.id ? "rotate-180" : ""
                        }`}
                      />
                    </TableCell>
                  </TableRow>
                  {expandedValidator === validator.id && (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <Card className="border-0 shadow-none bg-secondary/50">
                          <CardContent className="p-6">
                            <div className="grid gap-6 md:grid-cols-2">
                              {/* Validator Details */}
                              <div className="space-y-4">
                                <h4 className="text-sm font-medium">Validator Details</h4>
                                <div className="space-y-2">
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Identity: </span>
                                    {validator.identity}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Website: </span>
                                    <a
                                      href={validator.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:text-primary/90"
                                    >
                                      {validator.website}
                                    </a>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Description: </span>
                                    {validator.description}
                                  </div>
                                </div>

                                {/* Performance Metrics */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Performance</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <div className="text-sm text-muted-foreground">Self Stake</div>
                                      <div className="text-sm font-medium">
                                        {(validator.selfStaked / 1000000).toFixed(1)}M NZT
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-muted-foreground">Uptime</div>
                                      <div className="text-sm font-medium">{validator.uptime}%</div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Staking Form */}
                              <div className="space-y-4">
                                <h4 className="text-sm font-medium">Stake with Validator</h4>
                                <div className="space-y-2">
                                  <Label>Amount to Stake</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      placeholder="0.0"
                                      value={stakeAmount}
                                      onChange={(e) => setStakeAmount(e.target.value)}
                                    />
                                    <Button className="w-20">MAX</Button>
                                  </div>
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Balance: 0 NZT</span>
                                    <span>Min Stake: 100 NZT</span>
                                  </div>
                                </div>

                                {/* Reward Estimate */}
                                <div className="rounded-lg border border-border bg-card/50 p-3 space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger className="flex items-center gap-2 text-muted-foreground">
                                          <Info className="h-4 w-4" />
                                          Estimated Daily Reward
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Based on current APY and stake amount</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <span>
                                      {stakeAmount
                                        ? `${((Number.parseFloat(stakeAmount) * validator.apy) / 365).toFixed(2)} NZT`
                                        : "0.00 NZT"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger className="flex items-center gap-2 text-muted-foreground">
                                          <Info className="h-4 w-4" />
                                          Commission
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Validator's commission on rewards</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <span>{validator.commission}%</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger className="flex items-center gap-2 text-muted-foreground">
                                          <Info className="h-4 w-4" />
                                          Unbonding Period
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Time required to unstake tokens</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <span>{stakingStats.unbondingPeriod}</span>
                                  </div>
                                </div>

                                <Button className="w-full" size="lg">
                                  Stake with {validator.name}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Your Staking Positions */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Your Staking Positions</CardTitle>
          <CardDescription>Manage your staked tokens and rewards</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">No active staking positions</CardContent>
      </Card>
    </div>
  )
}

