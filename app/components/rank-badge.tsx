import Image from "next/image"
import { cn } from "@/lib/utils"

interface RankBadgeProps {
  rank: number
  size?: "sm" | "md" | "lg"
  showAnimation?: boolean
}

export function RankBadge({ rank, size = "md", showAnimation = true }: RankBadgeProps) {
  const getBadgeImage = (rank: number) => {
    switch (rank) {
      case 1:
        return "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-gmRla10dh3hferIJp6OyArG8eGFXgf.png"
      case 2:
        return "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-591vonZt1QxCJaPa9YN3efXvvJa2Iu.png"
      case 3:
        return "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-FPXQvoEfQNnwAzDSP6rF7otuqcf95p.png"
      case 4:
        return "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4-tSfZtIMHmSRrkhTn7i7RIcaoS3zc5W.png"
      case 5:
        return "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5-Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9.png"
      default:
        return "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-gmRla10dh3hferIJp6OyArG8eGFXgf.png"
    }
  }

  const getSizeClass = (size: string) => {
    switch (size) {
      case "sm":
        return "h-6 w-6"
      case "lg":
        return "h-12 w-12"
      default:
        return "h-8 w-8"
    }
  }

  return (
    <div className={cn("relative", getSizeClass(size))}>
      <Image
        src={getBadgeImage(rank)}
        alt={`Rank ${rank}`}
        fill
        className="object-contain"
      />
      {showAnimation && (
        <div className="absolute inset-0 animate-pulse-subtle rounded-full bg-primary/10" />
      )}
    </div>
  )
} 