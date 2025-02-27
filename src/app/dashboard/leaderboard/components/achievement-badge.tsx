import { cn } from "@/lib/utils"
import styles from "../styles.module.css"
import type { LucideIcon } from "lucide-react"

interface AchievementBadgeProps {
  name: string
  description: string
  icon: LucideIcon
  rarity: "legendary" | "epic" | "rare"
  progress?: number
}

export function AchievementBadge({ name, description, icon: Icon, rarity, progress }: AchievementBadgeProps) {
  return (
    <div className={cn(styles.achievementBadge, styles[rarity], "group")}>
      <div className="flex items-center gap-3 p-2">
        <div className="rounded-full bg-background/10 p-2">
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <div className="font-medium text-primary-foreground">{name}</div>
          <div className="text-xs text-primary-foreground/70">{description}</div>
          {progress !== undefined && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-background/20">
              <div
                className="h-full bg-primary-foreground transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

