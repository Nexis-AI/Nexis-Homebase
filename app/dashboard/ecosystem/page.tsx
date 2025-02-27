"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Search, ExternalLink, Users, ArrowUpRight, Shield, Code2, Boxes } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Project categories
const categories = [
  { id: "all", name: "All Projects" },
  { id: "defi", name: "DeFi" },
  { id: "nft", name: "NFT" },
  { id: "gaming", name: "Gaming" },
  { id: "infrastructure", name: "Infrastructure" },
  { id: "tools", name: "Tools" },
]

// Project statuses
const statuses = {
  live: { label: "Live", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  beta: { label: "Beta", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  upcoming: { label: "Upcoming", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
}

// Mock ecosystem projects data
const projects = [
  {
    id: 1,
    name: "NexSwap",
    description: "Decentralized exchange with advanced trading features",
    category: "defi",
    status: "live",
    logo: "/placeholder.svg?height=60&width=60",
    metrics: {
      tvl: "$12.5M",
      users: "15.2K",
      volume24h: "$2.3M",
    },
    links: {
      website: "https://nexswap.nexis.network",
      docs: "https://docs.nexswap.nexis.network",
      github: "https://github.com/nexis-network/nexswap",
    },
    featured: true,
    verified: true,
    tags: ["AMM", "Yield Farming", "Staking"],
  },
  {
    id: 2,
    name: "NexLend",
    description: "Lending and borrowing protocol",
    category: "defi",
    status: "beta",
    logo: "/placeholder.svg?height=60&width=60",
    metrics: {
      tvl: "$8.1M",
      users: "5.6K",
      volume24h: "$1.2M",
    },
    links: {
      website: "https://nexlend.nexis.network",
      docs: "https://docs.nexlend.nexis.network",
    },
    featured: false,
    verified: true,
    tags: ["Lending", "Borrowing", "Collateral"],
  },
  {
    id: 3,
    name: "NexNFT",
    description: "NFT marketplace and creation platform",
    category: "nft",
    status: "live",
    logo: "/placeholder.svg?height=60&width=60",
    metrics: {
      tvl: "$3.2M",
      users: "25.7K",
      volume24h: "$450K",
    },
    links: {
      website: "https://nexnft.nexis.network",
    },
    featured: true,
    verified: true,
    tags: ["Marketplace", "NFT Creation", "Auctions"],
  },
  {
    id: 4,
    name: "CryptoQuest",
    description: "Blockchain-based RPG game",
    category: "gaming",
    status: "upcoming",
    logo: "/placeholder.svg?height=60&width=60",
    metrics: {
      users: "2.1K",
    },
    links: {
      website: "https://cryptoquest.nexis.network",
    },
    featured: false,
    verified: false,
    tags: ["Gaming", "P2E", "Metaverse"],
  },
  {
    id: 5,
    name: "NexBridge",
    description: "Cross-chain bridge protocol",
    category: "infrastructure",
    status: "live",
    logo: "/placeholder.svg?height=60&width=60",
    metrics: {
      tvl: "$25.7M",
      users: "45.2K",
      volume24h: "$5.6M",
    },
    links: {
      website: "https://bridge.nexis.network",
      docs: "https://docs.bridge.nexis.network",
      github: "https://github.com/nexis-network/bridge",
    },
    featured: true,
    verified: true,
    tags: ["Bridge", "Cross-chain", "Infrastructure"],
  },
]

export default function EcosystemPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  // Filter projects based on search term, category, and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || project.category === selectedCategory
    const matchesStatus = !selectedStatus || project.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Ecosystem statistics
  const stats = {
    totalProjects: projects.length,
    totalTVL: "$49.5M",
    activeUsers: "93.8K",
    monthlyVolume: "$9.5M",
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ecosystem</h1>
          <p className="text-base text-muted-foreground">Discover projects building on Nexis Network</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Projects</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{stats.totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total TVL</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{stats.totalTVL}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active Users</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{stats.activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Monthly Volume</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{stats.monthlyVolume}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(statuses).map(([key, { label, color }]) => (
                  <Badge
                    key={key}
                    variant="outline"
                    className={`cursor-pointer ${selectedStatus === key ? color : ""}`}
                    onClick={() => setSelectedStatus(selectedStatus === key ? null : key)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                      <Image
                        src={project.logo || "/placeholder.svg"}
                        alt={project.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {project.name}
                        {project.verified && <Shield className="h-4 w-4 text-primary" />}
                      </CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className={statuses[project.status].color}>
                    {statuses[project.status].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project Metrics */}
                {project.metrics && (
                  <div className="grid grid-cols-3 gap-4 rounded-lg border bg-card/50 p-3">
                    {project.metrics.tvl && (
                      <div>
                        <div className="text-sm text-muted-foreground">TVL</div>
                        <div className="font-medium">{project.metrics.tvl}</div>
                      </div>
                    )}
                    {project.metrics.users && (
                      <div>
                        <div className="text-sm text-muted-foreground">Users</div>
                        <div className="font-medium">{project.metrics.users}</div>
                      </div>
                    )}
                    {project.metrics.volume24h && (
                      <div>
                        <div className="text-sm text-muted-foreground">24h Volume</div>
                        <div className="font-medium">{project.metrics.volume24h}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Links */}
                <div className="flex gap-2">
                  {project.links.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(project.links.website, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </Button>
                  )}
                  {project.links.docs && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(project.links.docs, "_blank")}
                    >
                      <Code2 className="h-4 w-4" />
                      Docs
                    </Button>
                  )}
                </div>
              </CardContent>

              {project.featured && (
                <div className="absolute -right-12 top-4 rotate-45 bg-primary px-14 py-1 text-xs font-medium text-primary-foreground">
                  Featured
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="p-12 text-center">
          <CardContent>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No projects found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

