"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CuboidIcon as Cube,
  CheckCircle2,
  Clock,
  ArrowRight,
  Rocket,
  Wallet,
  Users,
  Share2,
  Zap,
  Search,
  Star,
  Timer,
  Trophy,
  TrendingUp,
  Lock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import styles from "./styles.module.css"

// Quest categories with their respective colors and icons
const categories = {
  onboarding: {
    label: "Onboarding",
    color: "bg-blue-500",
    icon: Rocket,
    description: "Get started with Nexis Network",
  },
  trading: {
    label: "Trading",
    color: "bg-green-500",
    icon: Wallet,
    description: "Master trading mechanics",
  },
  social: {
    label: "Social",
    color: "bg-purple-500",
    icon: Users,
    description: "Engage with the community",
  },
  engagement: {
    label: "Engagement",
    color: "bg-yellow-500",
    icon: Share2,
    description: "Participate in ecosystem activities",
  },
  advanced: {
    label: "Advanced",
    color: "bg-red-500",
    icon: Zap,
    description: "Advanced protocol features",
  },
}

// Difficulty levels
const difficulties = {
  beginner: {
    label: "Beginner",
    color: "text-green-500",
    icon: Star,
    multiplier: 1,
  },
  intermediate: {
    label: "Intermediate",
    color: "text-yellow-500",
    icon: Star,
    multiplier: 1.5,
  },
  advanced: {
    label: "Advanced",
    color: "text-red-500",
    icon: Star,
    multiplier: 2,
  },
}

// Enhanced quest data
const quests = [
  {
    id: 1,
    title: "Welcome to Nexis",
    category: "onboarding",
    difficulty: "beginner",
    reward: 100,
    status: "completed",
    progress: 100,
    description: "Complete the basic onboarding steps to get started with Nexis Network",
    estimatedTime: "15 mins",
    completedBy: 15234,
    unlocks: [2, 3],
    steps: [
      { title: "Create a Nexis Account", completed: true, reward: 25 },
      { title: "Complete Email Verification", completed: true, reward: 25 },
      { title: "Set Up 2FA Security", completed: true, reward: 25 },
      { title: "Complete KYC Verification", completed: true, reward: 25 },
    ],
    achievements: [
      { title: "Quick Starter", description: "Complete onboarding in under 10 minutes", earned: true },
      { title: "Security First", description: "Enable all security features", earned: true },
    ],
  },
  {
    id: 2,
    title: "First Trade",
    category: "trading",
    difficulty: "beginner",
    reward: 250,
    status: "in_progress",
    progress: 50,
    description: "Complete your first trade on Nexis Network",
    estimatedTime: "30 mins",
    completedBy: 12150,
    prerequisite: 1,
    steps: [
      { title: "Deposit Any Token", completed: true, reward: 50 },
      { title: "Place a Limit Order", completed: true, reward: 75 },
      { title: "Complete a Swap", completed: false, reward: 75 },
      { title: "Try Advanced Trading Features", completed: false, reward: 50 },
    ],
    achievements: [
      { title: "First Swap", description: "Complete your first token swap", earned: false },
      { title: "Market Maker", description: "Place your first limit order", earned: true },
    ],
  },
  {
    id: 3,
    title: "Social Ambassador",
    category: "social",
    difficulty: "intermediate",
    reward: 500,
    status: "not_started",
    progress: 0,
    description: "Engage with the Nexis community on social media",
    estimatedTime: "60 mins",
    completedBy: 8765,
    prerequisite: 1,
    steps: [
      { title: "Follow Nexis on Twitter", completed: false, reward: 100 },
      { title: "Join Discord Community", completed: false, reward: 100 },
      { title: "Share a Nexis Post", completed: false, reward: 150 },
      { title: "Participate in Community Discussion", completed: false, reward: 150 },
    ],
    achievements: [
      { title: "Social Butterfly", description: "Engage on all social platforms", earned: false },
      { title: "Community Contributor", description: "Actively participate in discussions", earned: false },
    ],
  },
  {
    id: 4,
    title: "Liquidity Provider",
    category: "advanced",
    difficulty: "advanced",
    reward: 1000,
    status: "not_started",
    progress: 0,
    description: "Provide liquidity to Nexis pools and earn rewards",
    estimatedTime: "24 hrs",
    completedBy: 3456,
    prerequisite: 2,
    steps: [
      { title: "Add Liquidity to Any Pool", completed: false, reward: 250 },
      { title: "Maintain Position for 7 Days", completed: false, reward: 250 },
      { title: "Earn First LP Rewards", completed: false, reward: 250 },
      { title: "Try Multiple Pools", completed: false, reward: 250 },
    ],
    achievements: [
      { title: "Liquidity King", description: "Provide liquidity to multiple pools", earned: false },
      { title: "Yield Farmer", description: "Earn significant LP rewards", earned: false },
    ],
  },
  {
    id: 5,
    title: "Community Engagement",
    category: "engagement",
    difficulty: "intermediate",
    reward: 300,
    status: "in_progress",
    progress: 75,
    description: "Participate in Nexis community events and activities",
    estimatedTime: "45 mins",
    completedBy: 9876,
    steps: [
      { title: "Join Community Call", completed: true, reward: 75 },
      { title: "Submit Feedback", completed: true, reward: 75 },
      { title: "Vote in Governance", completed: true, reward: 75 },
      { title: "Create Community Content", completed: false, reward: 75 },
    ],
    achievements: [
      { title: "Voice of the People", description: "Participate in governance voting", earned: true },
      { title: "Feedback Provider", description: "Submit valuable feedback", earned: true },
    ],
  },
]

// Achievement badges data
const achievementBadges = [
  {
    id: "early_adopter",
    title: "Early Adopter",
    description: "One of the first 1000 users",
    icon: Rocket,
    rarity: "legendary",
    boost: 2.5,
  },
  {
    id: "trading_expert",
    title: "Trading Expert",
    description: "Complete all trading quests",
    icon: TrendingUp,
    rarity: "epic",
    boost: 2.0,
  },
  // Add more badges...
]

export default function QuestsPage() {
  const [expandedQuest, setExpandedQuest] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [activeTab, setActiveTab] = useState("active")
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false)

  // Filter quests based on search, category, and difficulty
  const filteredQuests = quests.filter((quest) => {
    const matchesSearch =
      quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quest.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || quest.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "all" || quest.difficulty === selectedDifficulty
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && quest.status !== "completed") ||
      (activeTab === "completed" && quest.status === "completed")

    return matchesSearch && matchesCategory && matchesDifficulty && matchesTab
  })

  // Calculate statistics
  const totalCubes = quests.reduce((acc, quest) => acc + quest.reward, 0)
  const earnedCubes = quests
    .filter((quest) => quest.status === "completed")
    .reduce((acc, quest) => acc + quest.reward, 0)
  const completionRate = (quests.filter((q) => q.status === "completed").length / quests.length) * 100

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Quests</h1>
            <p className="text-base text-muted-foreground">Complete quests to earn CUBE rewards</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 md:flex md:gap-6">
            <Card className={cn("relative overflow-hidden", styles.statsCard)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Cube className="h-4 w-4 text-primary" />
                  <span className="font-medium">Total CUBEs</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{earnedCubes}</span>
                  <span className="text-sm text-muted-foreground">/ {totalCubes}</span>
                </div>
                <Progress value={(earnedCubes / totalCubes) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card className={cn("relative overflow-hidden", styles.statsCard)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="font-medium">Completion Rate</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{completionRate.toFixed(1)}%</span>
                  <span className="text-sm text-muted-foreground">completed</span>
                </div>
                <Progress value={completionRate} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters Section */}
        <Card className={styles.filtersCard}>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                  <TabsList>
                    <TabsTrigger value="active" className="flex-1">
                      Active
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="flex-1">
                      Completed
                    </TabsTrigger>
                    <TabsTrigger value="all" className="flex-1">
                      All
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(categories).map(([key, category]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  className={cn("gap-2 transition-all", selectedCategory === key && styles.selectedCategory)}
                  onClick={() => setSelectedCategory(selectedCategory === key ? "all" : key)}
                >
                  <category.icon className="h-4 w-4" />
                  {category.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quests Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredQuests.map((quest) => (
            <motion.div
              key={quest.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={cn(
                  "group relative overflow-hidden transition-all hover:shadow-lg",
                  styles.questCard,
                  quest.status === "completed" && styles.completedQuest,
                )}
              >
                {/* Quest Header */}
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      {quest.prerequisite && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          Requires: Quest #{quest.prerequisite}
                        </div>
                      )}
                      <CardTitle className="text-lg">{quest.title}</CardTitle>
                      <CardDescription>{quest.description}</CardDescription>
                    </div>
                    <div className={cn("rounded-full p-2", categories[quest.category].color)}>
                      {(() => {
                        const IconComponent = categories[quest.category].icon
                        return <IconComponent className="h-4 w-4 text-white" />
                      })()}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Quest Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span>{quest.progress}%</span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${quest.progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Quest Info */}
                  <div className="grid grid-cols-2 gap-4 rounded-lg border bg-card/50 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <span>{quest.estimatedTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{quest.completedBy.toLocaleString()} completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className={cn("h-4 w-4", difficulties[quest.difficulty].color)} />
                      <span>{difficulties[quest.difficulty].label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cube className="h-4 w-4 text-primary" />
                      <span>{quest.reward} CUBE</span>
                    </div>
                  </div>

                  {/* Quest Steps Preview */}
                  <div className="space-y-2">
                    {quest.steps.slice(0, 2).map((step, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-lg border bg-card/50 p-2 text-sm">
                        {step.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={cn(step.completed && "text-muted-foreground line-through")}>{step.title}</span>
                      </div>
                    ))}
                    {quest.steps.length > 2 && (
                      <div className="text-center text-sm text-muted-foreground">
                        +{quest.steps.length - 2} more steps
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button
                    className={cn("w-full gap-2 transition-all", styles.questButton)}
                    disabled={
                      quest.prerequisite && !quests.find((q) => q.id === quest.prerequisite)?.status === "completed"
                    }
                  >
                    {quest.status === "completed" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </>
                    ) : quest.status === "in_progress" ? (
                      <>
                        <ArrowRight className="h-4 w-4" />
                        Continue
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4" />
                        Start Quest
                      </>
                    )}
                  </Button>
                </CardContent>

                {/* Achievement Badges */}
                {quest.achievements && quest.achievements.some((a) => a.earned) && (
                  <div className="absolute -right-12 top-4 rotate-45 bg-primary px-14 py-1 text-xs font-medium text-primary-foreground">
                    {quest.achievements.filter((a) => a.earned).length} Achievements
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredQuests.length === 0 && (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No quests found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
                setSelectedDifficulty("all")
              }}
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

