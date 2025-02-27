"use client"

import { useState } from "react"
import { Clock, LockKeyhole, Unlock, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VestingChart } from "./components/vesting-chart"
import { WithdrawRestake } from "./components/withdraw-restake"

// Mock data for recentClaims and vestingSchedules
const recentClaims = [
  {
    date: Date.now(),
    schedule: "Schedule A",
    amount: "100 NZT",
    tx: "0x1234567890abcdef",
  },
  {
    date: Date.now() - 86400000, // One day ago
    schedule: "Schedule B",
    amount: "50 NZT",
    tx: "0xfedcba0987654321",
  },
]

const vestingSchedules = [
  {
    name: "Schedule A",
    allocation: 10000000,
    unlocked: 5000000,
    claimed: 2000000,
  },
  {
    name: "Schedule B",
    allocation: 5000000,
    unlocked: 2500000,
    claimed: 1000000,
  },
]

export default function VestingPage() {
  // Initialize activeSchedule with the first schedule's name
  const [activeSchedule, setActiveSchedule] = useState(vestingSchedules[0].name)
  const [activeTab, setActiveTab] = useState("claims")

  // Find the current schedule or default to the first one
  const currentSchedule = vestingSchedules.find((s) => s.name === activeSchedule) ?? vestingSchedules[0]
  const claimableAmount = currentSchedule.unlocked - currentSchedule.claimed

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Vesting</h1>
        <p className="text-base text-muted-foreground">Manage your vested tokens</p>
      </div>

      {/* Vesting Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Allocation</p>
            </div>
            <p className="text-2xl font-semibold">{(currentSchedule.allocation / 1000000).toFixed(1)}M NZT</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Unlock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Unlocked Amount</p>
            </div>
            <p className="text-2xl font-semibold">{(currentSchedule.unlocked / 1000000).toFixed(1)}M NZT</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Locked Amount</p>
            </div>
            <p className="text-2xl font-semibold">
              {((currentSchedule.allocation - currentSchedule.unlocked) / 1000000).toFixed(1)}M NZT
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Claimable Amount</p>
            </div>
            <p className="text-2xl font-semibold">{(claimableAmount / 1000000).toFixed(1)}M NZT</p>
          </CardContent>
        </Card>
      </div>

      {/* Vesting Chart */}
      <VestingChart />

      {/* Withdraw/Restake Section */}
      <WithdrawRestake
        availableAmount={claimableAmount}
        earlyStakerSpotsLeft={127} // This would come from your API
      />

      {/* Combined Tables */}
      <Card className="border-border bg-card">
        <Tabs defaultValue="claims" onValueChange={setActiveTab}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View your claims and vesting details</CardDescription>
              </div>
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="claims">Recent Claims</TabsTrigger>
                <TabsTrigger value="schedules">Schedule Details</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "claims" ? (
              <TabsContent value="claims">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Transaction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentClaims.map((claim) => (
                      <TableRow key={claim.tx}>
                        <TableCell>{new Date(claim.date).toLocaleDateString()}</TableCell>
                        <TableCell>{claim.schedule}</TableCell>
                        <TableCell className="text-right">{claim.amount}</TableCell>
                        <TableCell className="text-right">
                          <a
                            href={`https://explorer.nexis.network/tx/${claim.tx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/90"
                          >
                            {claim.tx}
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ) : (
              <TabsContent value="schedules">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Schedule</TableHead>
                      <TableHead className="text-right">Allocation</TableHead>
                      <TableHead className="text-right">Unlocked</TableHead>
                      <TableHead className="text-right">Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vestingSchedules.map((schedule) => (
                      <TableRow
                        key={schedule.name}
                        className={schedule.name === activeSchedule ? "bg-secondary/50" : ""}
                        onClick={() => setActiveSchedule(schedule.name)}
                        style={{ cursor: "pointer" }}
                      >
                        <TableCell>{schedule.name}</TableCell>
                        <TableCell className="text-right">{(schedule.allocation / 1000000).toFixed(1)}M NZT</TableCell>
                        <TableCell className="text-right">{(schedule.unlocked / 1000000).toFixed(1)}M NZT</TableCell>
                        <TableCell className="text-right">
                          {((schedule.unlocked / schedule.allocation) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}

