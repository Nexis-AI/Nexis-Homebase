import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import styles from "../styles.module.css"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subValue?: string
  trend?: "up" | "down" | "neutral"
}

export function StatsCard({ icon: Icon, label, value, subValue, trend }: StatsCardProps) {
  return (
    <Card className={styles.statsCard}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold">{value}</div>
          {subValue && (
            <div
              className={cn(
                "text-sm",
                trend === "up" && styles.performanceUp,
                trend === "down" && styles.performanceDown,
                trend === "neutral" && "text-muted-foreground",
              )}
            >
              {subValue}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

