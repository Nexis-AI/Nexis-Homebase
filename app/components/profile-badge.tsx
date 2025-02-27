"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ProfilePanel } from "./profile-panel"

export function ProfileBadge() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 rounded-full"
        onClick={() => setIsProfileOpen(true)}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src="/placeholder.svg" alt="Profile" />
          <AvatarFallback>AT</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
      </Button>

      <ProfilePanel isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  )
}

