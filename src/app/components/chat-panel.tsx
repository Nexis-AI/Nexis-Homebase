"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setMessage("")

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm an AI assistant. I'm here to help you with any questions about Nexis Network.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    }, 1000)
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group fixed left-6 top-24 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg transition-all hover:scale-110"
      >
        <div className="space-y-2">
          <motion.span
            animate={isOpen ? { rotate: 45, y: 10 } : { rotate: 0, y: 0 }}
            className="block h-0.5 w-6 bg-primary-foreground transition-all"
          />
          <motion.span
            animate={isOpen ? { rotate: -45 } : { rotate: 0 }}
            className="block h-0.5 w-6 bg-primary-foreground transition-all"
          />
        </div>
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -384 }} // w-96 = 384px
            animate={{ x: 0 }}
            exit={{ x: -384 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="fixed left-0 top-0 z-40 flex h-screen w-96 flex-col border-r border-border bg-background shadow-xl"
          >
            {/* Header */}
            <div className="border-b border-border p-4">
              <h2 className="text-lg font-semibold">Nexis AI Assistant</h2>
              <p className="text-sm text-muted-foreground">Ask me anything about Nexis Network</p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${msg.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}
                  >
                    {msg.role === "assistant" && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/ai-avatar.png" alt="AI" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        msg.role === "assistant" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    {msg.role === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/user-avatar.png" alt="User" />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

