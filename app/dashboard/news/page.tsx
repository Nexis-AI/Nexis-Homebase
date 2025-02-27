"use client"

import { useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import React from "react"

// Categories with their respective colors
const categories = [
  { name: "All", color: "bg-primary" },
  { name: "AI", color: "bg-purple-500" },
  { name: "Developers", color: "bg-blue-500" },
  { name: "News", color: "bg-green-500" },
  { name: "Partnerships", color: "bg-yellow-500" },
  { name: "Hackathon", color: "bg-red-500" },
  { name: "Grants", color: "bg-pink-500" },
]

// Mock blog posts data
const blogPosts = [
  {
    id: 1,
    title: "Introducing Nexis AI: The Future of Blockchain Intelligence",
    excerpt: "Discover how Nexis AI is revolutionizing blockchain technology with advanced artificial intelligence...",
    category: "AI",
    image: "/placeholder.svg?height=400&width=800",
    date: "2024-02-23",
    readTime: 5,
    featured: true,
  },
  {
    id: 2,
    title: "New Developer Tools Release",
    excerpt:
      "Explore our latest suite of developer tools designed to enhance your blockchain development experience...",
    category: "Developers",
    image: "/placeholder.svg?height=200&width=400",
    date: "2024-02-22",
    readTime: 4,
  },
  {
    id: 3,
    title: "Strategic Partnership with Leading Tech Giant",
    excerpt: "Nexis Network announces a groundbreaking partnership to accelerate blockchain adoption...",
    category: "Partnerships",
    image: "/placeholder.svg?height=200&width=400",
    date: "2024-02-21",
    readTime: 3,
  },
  // Add more blog posts here...
  {
    id: 4,
    title: "Nexis Network Q1 2024 Hackathon Announced",
    excerpt: "Join our upcoming hackathon and build the future of decentralized applications...",
    category: "Hackathon",
    image: "/placeholder.svg?height=200&width=400",
    date: "2024-02-20",
    readTime: 2,
  },
  {
    id: 5,
    title: "Ecosystem Grants Program Launch",
    excerpt: "Apply for grants to build innovative solutions on Nexis Network...",
    category: "Grants",
    image: "/placeholder.svg?height=200&width=400",
    date: "2024-02-19",
    readTime: 4,
  },
  {
    id: 6,
    title: "Monthly Network Update",
    excerpt: "Check out the latest updates and improvements to the Nexis Network...",
    category: "News",
    image: "/placeholder.svg?height=200&width=400",
    date: "2024-02-18",
    readTime: 3,
  },
  {
    id: 7,
    title: "AI-Powered Smart Contract Auditing",
    excerpt: "Learn how we're using AI to enhance smart contract security...",
    category: "AI",
    image: "/placeholder.svg?height=200&width=400",
    date: "2024-02-17",
    readTime: 5,
  },
  {
    id: 8,
    title: "New Partnership with DeFi Protocol",
    excerpt: "Expanding the DeFi ecosystem with our latest partnership...",
    category: "Partnerships",
    image: "/placeholder.svg?height=200&width=400",
    date: "2024-02-16",
    readTime: 4,
  },
  {
    id: 9,
    title: "Developer Documentation Update",
    excerpt: "Major updates to our developer documentation and resources...",
    category: "Developers",
    image: "/placeholder.svg?height=200&width=400",
    date: "2024-02-15",
    readTime: 3,
  },
  {
    id: 10,
    title: "Hackathon Winners Announced",
    excerpt: "See the winning projects from our recent hackathon...",
    category: "Hackathon",
    image: "/placeholder.svg?height=200&width=400",
    date: "2024-02-14",
    readTime: 4,
  },
]

// Mock tweets data
const tweets = [
  {
    id: "1",
    content:
      "Excited to announce our latest partnership with @TechGiant! Together, we're building the future of blockchain. 🚀 #NexisNetwork #Blockchain",
    date: "2024-02-23T12:00:00Z",
    likes: 1234,
    retweets: 567,
  },
  {
    id: "2",
    content:
      "Join us for the upcoming Nexis Network Hackathon! $100K in prizes to be won. Register now at nexis.network/hackathon 🏆 #NexisHackathon",
    date: "2024-02-22T15:30:00Z",
    likes: 892,
    retweets: 345,
  },
  {
    id: "3",
    content:
      "New milestone achieved: 1M+ transactions processed on Nexis Network! Thank you to our amazing community for your continued support. 📈 #Growth",
    date: "2024-02-21T18:45:00Z",
    likes: 2156,
    retweets: 891,
  },
]

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [currentTweetIndex, setCurrentTweetIndex] = useState(0)

  // Add error handling for filtering posts
  const filteredPosts = React.useMemo(() => {
    try {
      return selectedCategory === "All" ? blogPosts : blogPosts.filter((post) => post.category === selectedCategory)
    } catch (error) {
      console.error("Error filtering posts:", error)
      return []
    }
  }, [selectedCategory])

  const featuredPost = React.useMemo(() => {
    try {
      return blogPosts.find((post) => post.featured)
    } catch (error) {
      console.error("Error finding featured post:", error)
      return null
    }
  }, [])

  const regularPosts = React.useMemo(() => {
    try {
      return filteredPosts.filter((post) => !post.featured)
    } catch (error) {
      console.error("Error filtering regular posts:", error)
      return []
    }
  }, [filteredPosts])

  const nextTweet = () => {
    try {
      setCurrentTweetIndex((prev) => (prev + 1) % tweets.length)
    } catch (error) {
      console.error("Error updating tweet index:", error)
    }
  }

  const previousTweet = () => {
    try {
      setCurrentTweetIndex((prev) => (prev - 1 + tweets.length) % tweets.length)
    } catch (error) {
      console.error("Error updating tweet index:", error)
    }
  }

  // Add error boundary for the entire component
  if (!Array.isArray(filteredPosts) || !Array.isArray(tweets)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Content</CardTitle>
            <CardDescription>There was an error loading the news content. Please try again later.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">News</h1>
        <p className="text-base text-muted-foreground">Latest updates and announcements</p>
      </div>

      {/* Featured Post */}
      {featuredPost && (
        <Card className="overflow-hidden border-none bg-card/30 backdrop-blur-sm">
          <div className="relative aspect-[21/9] overflow-hidden rounded-t-lg">
            <Image
              src={featuredPost.image || "/placeholder.svg"}
              alt={featuredPost.title}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
          </div>
          <CardContent className="grid gap-4 p-6">
            <div className="flex items-center gap-4">
              <Badge className={`${categories.find((cat) => cat.name === featuredPost.category)?.color} text-white`}>
                {featuredPost.category}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(featuredPost.date), "MMM d, yyyy")}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {featuredPost.readTime} min read
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">{featuredPost.title}</h2>
              <p className="text-muted-foreground">{featuredPost.excerpt}</p>
            </div>
            <Button className="w-fit">
              Read More
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.name}
            variant={selectedCategory === category.name ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.name)}
            className="transition-all"
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Blog Posts Grid - Updated with fixed heights */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="wait">
          {regularPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="flex h-[32rem] flex-col overflow-hidden border-border bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors">
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={post.image || "/placeholder.svg"}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Badge className={`${categories.find((cat) => cat.name === post.category)?.color} text-white`}>
                        {post.category}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {post.readTime} min read
                      </div>
                    </div>
                    <div>
                      <h3 className="line-clamp-2 text-xl font-semibold leading-tight tracking-tight">{post.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">{format(new Date(post.date), "MMM d, yyyy")}</div>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Twitter Carousel */}
      <Card className="overflow-hidden border-border bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z" />
            </svg>
            Latest Tweets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tweets[currentTweetIndex].id}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <p className="text-lg">{tweets[currentTweetIndex].content}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{format(new Date(tweets[currentTweetIndex].date), "MMM d, yyyy")}</span>
                    <div className="flex items-center gap-4">
                      <span>🔄 {tweets[currentTweetIndex].retweets}</span>
                      <span>❤️ {tweets[currentTweetIndex].likes}</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="absolute right-0 top-1/2 flex -translate-y-1/2 gap-2">
              <Button variant="outline" size="icon" onClick={previousTweet} className="h-8 w-8 rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextTweet} className="h-8 w-8 rounded-full">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

