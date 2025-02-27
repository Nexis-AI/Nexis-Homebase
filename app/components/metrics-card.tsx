"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface MetricsCardProps {
  title: string
  value: string | number
  change?: number
  subValue?: string
  icon: LucideIcon
  trend?: "up" | "down" | "neutral"
}

export function MetricsCard({ title, value, change, subValue, icon: Icon, trend }: MetricsCardProps) {
  return (
    <Card className="relative overflow-hidden rounded-lg border border-white/10 bg-card p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {(change || subValue) && (
          <p className="text-xs text-muted-foreground">
            {change && (
              <span className={trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : ""}>
                {change > 0 ? "+" : ""}
                {change}%
              </span>
            )}
            {subValue && ` ${subValue}`}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

