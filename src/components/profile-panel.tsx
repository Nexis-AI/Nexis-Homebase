"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wallet, Trophy, CuboidIcon as Cube, ChevronRight, ExternalLink, Copy, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { RankBadge } from "./rank-badge"
import { toast } from "sonner"

interface ProfilePanelProps {
  isOpen: boolean
  onClose: () => void
}

// Mock user data - replace with real data in production
const userData = {
  name: "Alex Thompson",
  wallet: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  avatar: "/placeholder.svg",
  cubes: 15750,
  rank: 12,
  level: 42,
  xp: 7500,
  xpRequired: 10000,
  achievements: 24,
}

export function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userData.wallet)
      setCopied(true)
      toast.success("Wallet address copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Failed to copy address")
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute right-0 top-0 z-50 flex h-[100vh] w-80 flex-col border-l border-border bg-card shadow-xl"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-lg font-semibold">Profile</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={userData.avatar} />
                <AvatarFallback>AT</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{userData.name}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Level {userData.level}</span>
                  <span>•</span>
                  <span>{userData.achievements} Achievements</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Level Progress</span>
                <span>
                  {userData.xp}/{userData.xpRequired} XP
                </span>
              </div>
              <Progress value={(userData.xp / userData.xpRequired) * 100} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <div className="flex items-center gap-2">
                  <Cube className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">CUBES</span>
                </div>
                <div className="mt-2 text-2xl font-bold">{userData.cubes.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Rank</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <RankBadge rank={userData.rank} />
                  <span className="text-2xl font-bold">#{userData.rank}</span>
                </div>
              </div>
            </div>

            {/* Wallet Section */}
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="font-medium">Connected Wallet</span>
                </div>
                <a
                  href={`https://explorer.nexis.network/address/${userData.wallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                <span className="truncate">{userData.wallet}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Recent Activity Preview */}
            <div className="space-y-2">
              <h4 className="font-medium">Recent Activity</h4>
              <div className="space-y-2">
                {[
                  { action: "Completed Quest", reward: "+100 CUBE", time: "2h ago" },
                  { action: "Ranked Up", reward: "Rank #12", time: "1d ago" },
                  { action: "Achievement Unlocked", reward: "Early Adopter", time: "2d ago" },
                ].map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{activity.action}</div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                    <div className="text-sm text-primary">{activity.reward}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-border p-4">
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

