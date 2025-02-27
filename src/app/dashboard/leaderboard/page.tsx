"use client"

import React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Trophy,
  TrendingUp,
  Star,
  Activity,
  ChevronDown,
  ChevronUp,
  Users,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import styles from "./styles.module.css"
import { AchievementBadge } from "./components/achievement-badge"
import { RankBadge } from "./components/rank-badge"
import { cn } from "@/lib/utils"
import { StatsCard } from "./components/stats-card"

// Add time period options
const TIME_PERIODS = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "All", value: "all" },
]

// Add category options
const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Trading", value: "trading" },
  { label: "Staking", value: "staking" },
  { label: "Social", value: "social" },
]

// Mock data generator for the leaderboard
const generateLeaderboardData = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    const rankChange = Math.floor(Math.random() * 21) - 10
    const score = Math.floor(Math.random() * 10000)
    const transactions = Math.floor(Math.random() * 1000)
    const volume = Math.floor(Math.random() * 1000000)

    return {
      rank: i + 1,
      address: `0x${Math.random().toString(16).slice(2, 14)}...${Math.random().toString(16).slice(2, 6)}`,
      score,
      rankChange,
      transactions,
      volume,
      achievements: [
        { name: "Early Adopter", icon: Star },
        { name: "Top Trader", icon: TrendingUp },
        { name: "Community Leader", icon: Users },
      ].slice(0, Math.floor(Math.random() * 3) + 1),
      recentActivity: [
        {
          type: Math.random() > 0.5 ? "send" : "receive",
          amount: (Math.random() * 100).toFixed(2),
          token: "NZT",
          time: "2h ago",
        },
        {
          type: Math.random() > 0.5 ? "send" : "receive",
          amount: (Math.random() * 100).toFixed(2),
          token: "NZT",
          time: "5h ago",
        },
      ],
      stats: {
        weeklyGrowth: (Math.random() * 100 - 50).toFixed(2),
        successRate: (Math.random() * 100).toFixed(2),
        reputation: Math.floor(Math.random() * 100),
      },
    }
  })
}

const ITEMS_PER_PAGE = 10
const TOTAL_ITEMS = 1000

export default function LeaderboardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedUser, setExpandedUser] = useState<number | null>(null)
  const [sortField, setSortField] = useState<"rank" | "score" | "transactions" | "volume">("rank")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [timePeriod, setTimePeriod] = useState("24h")
  const [category, setCategory] = useState("all")

  // Generate and memoize the leaderboard data
  const leaderboardData = generateLeaderboardData(TOTAL_ITEMS)

  // Filter and sort the data
  const filteredData = leaderboardData.filter(
    (user) =>
      user.address.toLowerCase().includes(searchTerm.toLowerCase()) || user.rank.toString().includes(searchTerm),
  )

  const sortedData = [...filteredData].sort((a, b) => {
    const modifier = sortDirection === "asc" ? 1 : -1
    return (a[sortField] - b[sortField]) * modifier
  })

  // Pagination
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE)
  const paginatedData = sortedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Top performers stats
  const topPerformers = {
    totalUsers: TOTAL_ITEMS,
    averageScore: Math.floor(leaderboardData.reduce((acc, user) => acc + user.score, 0) / TOTAL_ITEMS),
    topGainer: {
      address: leaderboardData[0].address,
      change: "+23",
    },
    totalVolume: "₦12.5M",
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return rank
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="text-base text-muted-foreground">Top performers and statistics</p>
        </div>
      </div>

      {/* Add filter controls */}
      <div className="flex flex-wrap items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className={cn("gap-2", styles.timePeriodButton)}>
              <Calendar className="h-4 w-4" />
              {TIME_PERIODS.find((t) => t.value === timePeriod)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {TIME_PERIODS.map((period) => (
              <DropdownMenuItem key={period.value} onClick={() => setTimePeriod(period.value)}>
                {period.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className={cn("gap-2", styles.categoryPill)}>
              <Filter className="h-4 w-4" />
              {CATEGORIES.find((c) => c.value === category)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {CATEGORIES.map((cat) => (
              <DropdownMenuItem key={cat.value} onClick={() => setCategory(cat.value)}>
                {cat.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Overview with enhanced styling */}
      <div className={cn("grid gap-4 md:grid-cols-4", styles.statsGrid)}>
        <StatsCard
          icon={Users}
          label="Total Users"
          value={topPerformers.totalUsers}
          subValue={`+${Math.floor(Math.random() * 100)} this week`}
          trend="up"
        />
        <StatsCard
          icon={Trophy}
          label="Average Score"
          value={topPerformers.averageScore}
          subValue={`+${Math.floor(Math.random() * 10)}% from last period`}
          trend="up"
        />
        <StatsCard
          icon={TrendingUp}
          label="Top Gainer"
          value={topPerformers.topGainer.address}
          subValue={topPerformers.topGainer.change}
          trend="up"
        />
        <StatsCard
          icon={Activity}
          label="Total Volume"
          value={topPerformers.totalVolume}
          subValue="-5% from last period"
          trend="down"
        />
      </div>

      {/* Leaderboard Table with enhanced styling */}
      <Card className={styles.customScroll}>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Rankings</CardTitle>
              <CardDescription>View and compare user performance</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:min-w-[300px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by address or rank..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={`${ITEMS_PER_PAGE}`} onValueChange={(value) => setCurrentPage(1)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <Button variant="ghost" className="h-8 p-0 font-medium" onClick={() => handleSort("rank")}>
                      Rank
                      {sortField === "rank" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" className="h-8 p-0 font-medium" onClick={() => handleSort("score")}>
                      Score
                      {sortField === "score" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" className="h-8 p-0 font-medium" onClick={() => handleSort("transactions")}>
                      Transactions
                      {sortField === "transactions" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" className="h-8 p-0 font-medium" onClick={() => handleSort("volume")}>
                      Volume
                      {sortField === "volume" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((user) => (
                  <React.Fragment key={user.rank}>
                    <TableRow
                      className={cn(
                        "cursor-pointer",
                        styles.leaderboardRow,
                        expandedUser === user.rank && "bg-muted/50",
                      )}
                      onClick={() => setExpandedUser(expandedUser === user.rank ? null : user.rank)}
                    >
                      <TableCell>
                        <RankBadge rank={user.rank} showAnimation={true} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.address}</span>
                          {user.achievements.map((achievement, index) => (
                            <achievement.icon key={index} className="h-4 w-4 text-primary" title={achievement.name} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{user.score.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{user.transactions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₦{user.volume.toLocaleString()}</TableCell>
                      <TableCell>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${expandedUser === user.rank ? "rotate-180" : ""}`}
                        />
                      </TableCell>
                    </TableRow>
                    <AnimatePresence>
                      {expandedUser === user.rank && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="grid gap-4 bg-muted/50 p-4 md:grid-cols-3">
                                {/* User Stats */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Performance Stats</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div>
                                      <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Weekly Growth</span>
                                        <span
                                          className={user.stats.weeklyGrowth > 0 ? "text-green-500" : "text-red-500"}
                                        >
                                          {user.stats.weeklyGrowth}%
                                        </span>
                                      </div>
                                      <Progress value={Math.abs(Number(user.stats.weeklyGrowth))} />
                                    </div>
                                    <div>
                                      <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Success Rate</span>
                                        <span>{user.stats.successRate}%</span>
                                      </div>
                                      <Progress value={Number(user.stats.successRate)} />
                                    </div>
                                    <div>
                                      <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Reputation</span>
                                        <span>{user.stats.reputation}/100</span>
                                      </div>
                                      <Progress value={user.stats.reputation} />
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Recent Activity */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Recent Activity</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      {user.recentActivity.map((activity, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            {activity.type === "send" ? (
                                              <ArrowUpRight className="h-4 w-4 text-red-500" />
                                            ) : (
                                              <ArrowDownRight className="h-4 w-4 text-green-500" />
                                            )}
                                            <div>
                                              <div className="font-medium">
                                                {activity.amount} {activity.token}
                                              </div>
                                              <div className="text-xs text-muted-foreground">{activity.time}</div>
                                            </div>
                                          </div>
                                          <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <ExternalLink className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Achievements */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Achievements</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      {user.achievements.map((achievement) => (
                                        <AchievementBadge
                                          key={achievement.name}
                                          name={achievement.name}
                                          description="Achievement unlocked"
                                          icon={achievement.icon}
                                          rarity="legendary"
                                          progress={75}
                                        />
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = i + 1
                return (
                  <Button
                    key={i}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                )
              })}
              {totalPages > 5 && <span className="px-2">...</span>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

