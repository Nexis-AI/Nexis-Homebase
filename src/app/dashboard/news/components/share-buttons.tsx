"use client"

import { Facebook, Linkedin, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ShareButtons() {
  const shareUrl = typeof window !== "undefined" ? window.location.href : ""

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`, "_blank")
  }

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank")
  }

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Share this article</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="icon" className="h-12 w-full" onClick={shareOnTwitter}>
          <Twitter className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="icon" className="h-12 w-full" onClick={shareOnLinkedIn}>
          <Linkedin className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="icon" className="h-12 w-full" onClick={shareOnFacebook}>
          <Facebook className="h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  )
}

