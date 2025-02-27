"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wallet, Trophy, CuboidIcon as Cube, ChevronRight, ExternalLink, Copy, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { RankBadge } from "@/components/rank-badge"
import { toast } from "sonner"

interface ProfilePanelProps {
  isOpen: boolean
  onClose: () => void
}

// Mock user data - replace with real data in production
const userData = {
  name: "Alex Thompson",
  wallet: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  rank: 3,
  level: 42,
  xp: 4200,
  nextLevelXp: 5000,
  achievements: [
    { id: 1, name: "Early Adopter", completed: true },
    { id: 2, name: "First Transaction", completed: true },
    { id: 3, name: "Liquidity Provider", completed: false },
  ],
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
      toast.error("Failed to copy wallet address")
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border bg-card shadow-xl"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="text-xl font-semibold">Profile</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4">
                {/* User Info */}
                <div className="mb-6 flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/placeholder.svg" alt={userData.name} />
                    <AvatarFallback>{userData.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">{userData.name}</h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="truncate max-w-[150px]">{userData.wallet}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCopy}>
                        {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Rank & Level */}
                <div className="mb-6 space-y-4 rounded-lg border border-border bg-card/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      <span className="font-medium">Rank</span>
                    </div>
                    <RankBadge rank={userData.rank} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cube className="h-5 w-5 text-indigo-500" />
                        <span className="font-medium">Level {userData.level}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {userData.xp}/{userData.nextLevelXp} XP
                      </span>
                    </div>
                    <Progress value={(userData.xp / userData.nextLevelXp) * 100} className="h-2" />
                  </div>
                </div>

                {/* Achievements */}
                <div className="space-y-4">
                  <h4 className="font-medium">Achievements</h4>
                  <div className="space-y-2">
                    {userData.achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3"
                      >
                        <span className={achievement.completed ? "text-foreground" : "text-muted-foreground"}>
                          {achievement.name}
                        </span>
                        {achievement.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border p-4">
                <Button variant="outline" className="w-full justify-between">
                  <span>View on Explorer</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 