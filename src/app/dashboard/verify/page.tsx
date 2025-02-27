"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Shield, CheckCircle2, XCircle, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// Verification data
const VERIFIED_DOMAINS = [
  "https://nexis.network",
  "http://nexis.network",
  "https://nexswap.app",
  "http://nexswap.app",
  "https://nexscan.io",
  "http://nexscan.io",
  "https://chat.nexis.network",
  "https://portal.nexis.network",
]

const VERIFIED_USERNAMES = ["@nexis_network", "@NZT_Dev", "@marius_nzt", "@NAVIDSHOKRIYAN"]

export default function VerifyPage() {
  const [input, setInput] = useState("")
  const [verificationResult, setVerificationResult] = useState<{
    isVerified: boolean
    message: string
    type: "domain" | "username" | null
  } | null>(null)
  const [activeTab, setActiveTab] = useState<"search" | "domains" | "usernames">("search")

  const verifyInput = (value: string) => {
    const isDomain = value.includes(".")
    const isUsername = value.startsWith("@")

    if (isDomain) {
      // Clean up the URL
      const cleanUrl = value.toLowerCase().trim()
      const isVerified = VERIFIED_DOMAINS.some((domain) => {
        if (domain.includes("*")) {
          const pattern = domain.replace("*", ".*")
          return new RegExp(pattern).test(cleanUrl)
        }
        return domain === cleanUrl
      })

      setVerificationResult({
        isVerified,
        message: isVerified
          ? "✓ This is a verified Nexis Network domain"
          : "⚠️ Warning: This domain is not associated with Nexis Network. It might be a phishing attempt.",
        type: "domain",
      })
    } else if (isUsername) {
      const cleanUsername = value.toLowerCase().trim()
      const isVerified = VERIFIED_USERNAMES.some((username) => username.toLowerCase() === cleanUsername)

      setVerificationResult({
        isVerified,
        message: isVerified
          ? "✓ This is a verified Nexis Network team member"
          : "⚠️ Warning: This account is not associated with Nexis Network. It might be impersonating the team.",
        type: "username",
      })
    } else {
      setVerificationResult({
        isVerified: false,
        message: "Please enter a valid domain or username (starting with @)",
        type: null,
      })
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    verifyInput(input)
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Verify</h1>
        <p className="text-base text-muted-foreground">Verify Nexis Network domains and team members</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="usernames">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <Card className="border-border bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Verification Check</CardTitle>
              <CardDescription>
                Enter a domain or username to verify if it&apos;s associated with Nexis Network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter domain or @username"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button type="submit">Verify</Button>
                </div>

                <AnimatePresence mode="wait">
                  {verificationResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`rounded-lg p-4 ${
                        verificationResult.isVerified
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {verificationResult.isVerified ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 shrink-0" />
                        )}
                        <div className="space-y-2">
                          <p className="font-medium">{verificationResult.message}</p>
                          {verificationResult.isVerified && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-primary/5">
                                Verified by Nexis Network
                              </Badge>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(input)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains">
          <Card className="border-border bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Verified Domains</CardTitle>
              <CardDescription>Official domains associated with Nexis Network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {VERIFIED_DOMAINS.map((domain) => (
                  <div
                    key={domain}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium">{domain}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(domain)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(domain, "_blank", "noopener,noreferrer")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usernames">
          <Card className="border-border bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Official Nexis Network team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {VERIFIED_USERNAMES.map((username) => (
                  <div
                    key={username}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium">{username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(username)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          window.open(`https://twitter.com/${username.slice(1)}`, "_blank", "noopener,noreferrer")
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

