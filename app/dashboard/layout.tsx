"use client"

import type React from "react"
import { useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Home,
  Moon,
  Sun,
  Search,
  ChevronDown,
  BracketsIcon as Bridge,
  Coins,
  Scroll,
  Trophy,
  PenToolIcon as Tool,
  BarChart2,
  Newspaper,
  Shield,
  Boxes,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ProfileBadge } from "@/components/profile-badge"
import { Web3ModalButton } from "@/components/web3modal-button"

// Import Spline directly
import Spline from "@splinetool/react-spline"

// Update the sidebarItems array to include the new pages
const sidebarItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: Bridge, label: "Bridge", href: "/dashboard/bridge" },
  { icon: Coins, label: "Stake", href: "/dashboard/stake" },
  { icon: Scroll, label: "Vesting", href: "/dashboard/vesting" },
  { icon: Trophy, label: "Quests", href: "/dashboard/quests" },
  { icon: Tool, label: "Tools", href: "/dashboard/tools" },
  { icon: BarChart2, label: "Leaderboard", href: "/dashboard/leaderboard" },
  { icon: Newspaper, label: "News", href: "/dashboard/news" },
  { icon: Shield, label: "Verify", href: "/dashboard/verify" },
  { icon: Boxes, label: "Ecosystem", href: "/dashboard/ecosystem" },
  { icon: Wallet, label: "Faucet", href: "/dashboard/faucet" },
]

// Create a separate SplineComponent to handle the loading state
const SplineComponent = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  if (hasError) {
    return (
      <div className="absolute inset-0 w-full h-full bg-black backdrop-blur-md animate-gradient border border-white/10" />
    )
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-background/50 via-background/10 to-background/50 animate-gradient" />
      )}
      <Spline
        scene="https://prod.spline.design/uioKgDPzHUutGOyt/scene.splinecode"
        onLoad={handleLoad}
        onError={handleError}
        className="w-full h-full object-cover"
      />
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const pathname = usePathname()

  return (
    <div className="relative min-h-screen max-h-screen w-full p-2 sm:p-4">
      {/* Background with fallback */}
      <div className="fixed inset-0 z-0">
        <Suspense
          fallback={
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-background/50 via-background/10 to-background/50 animate-gradient" />
          }
        >
          <SplineComponent />
        </Suspense>
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex min-h-[calc(100vh-theme(spacing.8))] rounded-md border border-border bg-neutral-900/70 backdrop-blur-lg drop-shadow-md overflow-hidden">
        {/* Sliding Sidebar */}
        <aside className="sidebar fixed left-2 top-2 bottom-2 z-40 sm:left-4 sm:top-4 sm:bottom-4 lg:relative lg:left-0 lg:top-0 lg:bottom-0 lg:h-auto">
          <div className="flex h-full flex-col">
            <div className="sidebar-logo">
              <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Nexis-Profile-Photo%20(1)%201-8LcRo5KayRrYjaJWdzJIkA1fdh4YZF.png"
                  alt="Nexis Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <span className="sidebar-logo-text">Nexis Protocol</span>
            </div>
            <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
              {sidebarItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`nav-item ${pathname === item.href ? "active" : ""}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="nav-item-text">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 pl-16 lg:pl-0 relative">
          {/* Top Header */}
          <header className="h-16 border-b border-border flex items-center justify-between px-4 bg-background/90 backdrop-blur-sm sticky top-0 z-30">
            <div className="flex-1" />
            <div className="hidden sm:flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors border border-white/5">
              <Search className="h-4 w-4" />
              <span>Open Command Menu</span>
              <kbd className="hidden sm:inline-block text-xs bg-muted px-1.5 rounded">⌘K</kbd>
            </div>
            <div className="flex-1 flex justify-end items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="rounded-lg">
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              {/* Position ProfileBadge relative to the layout container */}
              <div className="relative h-8">
                <ProfileBadge />
              </div>
              <Web3ModalButton />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 sm:p-6 max-w-full">
              <div className="relative w-full">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

