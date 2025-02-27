"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TableOfContents() {
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([])
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll("h2, h3"))
    const headingData = elements.map((element) => ({
      id: element.id || element.textContent?.toLowerCase().replace(/\W+/g, "-") || "",
      text: element.textContent || "",
      level: Number.parseInt(element.tagName[1]),
    }))

    // Add IDs to elements that don't have them
    elements.forEach((element, index) => {
      if (!element.id) {
        element.id = headingData[index].id
      }
    })

    setHeadings(headingData)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "-20% 0px -80% 0px" },
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Table of Contents</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[calc(100vh-20rem)] overflow-auto">
        <nav className="space-y-1">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                activeId === heading.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
              } ${heading.level === 3 ? "ml-4" : ""}`}
              onClick={(e) => {
                e.preventDefault()
                document.querySelector(`#${heading.id}`)?.scrollIntoView({
                  behavior: "smooth",
                })
              }}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </CardContent>
    </Card>
  )
}

