import type React from "react"
interface UsageCircleProps {
  total: string
  progress: number
  label: string
  remaining: string
}

export function UsageCircle({ total, progress, label, remaining }: UsageCircleProps) {
  return (
    <div className="space-y-3">
      <div className="usage-circle" style={{ "--progress": `${progress}%` } as React.CSSProperties}>
        <div className="text-center">
          <div className="text-2xl font-medium tracking-tight">{total}</div>
          <div className="text-xs text-muted-foreground">total</div>
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{remaining}</div>
      </div>
    </div>
  )
}

