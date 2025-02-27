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
        return "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5-vfUXMH3Xm5YsL8WLVK3ccKwKlxTu2j.png"
      default:
        return null
    }
  }

  const getSizeClass = (size: string) => {
    switch (size) {
      case "sm":
        return "w-3 h-3 text-[10px]"
      case "lg":
        return "w-6 h-6 text-sm"
      default:
        return "w-5 h-5 text-xs"
    }
  }

  return (
    <div className={cn("relative flex items-center justify-center", getSizeClass(size))}>
      {getBadgeImage(rank) ? (
        <Image
          src={getBadgeImage(rank) || "/placeholder.svg"}
          alt={`Rank ${rank} Badge`}
          width={20}
          height={20}
          className="object-contain"
        />
      ) : (
        <span className="font-medium">{rank}</span>
      )}
    </div>
  )
}

