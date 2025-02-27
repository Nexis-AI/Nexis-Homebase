import { subHours, subDays, subMonths, getUnixTime } from "date-fns"

interface ChartDataPoint {
  timestamp: number
  price: number
  volume: number
}

export function generateChartData(
  basePrice: number,
  volatility: number,
  timePeriod: "1h" | "24h" | "7d" | "1m" | "1y" = "24h",
): {
  data: ChartDataPoint[]
  high24h: number
  low24h: number
} {
  const now = new Date()
  const points: ChartDataPoint[] = []
  let dataPoints: number
  let interval: number
  let startDate: Date

  // Configure time period settings
  switch (timePeriod) {
    case "1h":
      dataPoints = 60
      interval = 60 * 1000 // 1 minute
      startDate = subHours(now, 1)
      break
    case "24h":
      dataPoints = 144
      interval = 10 * 60 * 1000 // 10 minutes
      startDate = subHours(now, 24)
      break
    case "7d":
      dataPoints = 168
      interval = 60 * 60 * 1000 // 1 hour
      startDate = subDays(now, 7)
      break
    case "1m":
      dataPoints = 30
      interval = 24 * 60 * 60 * 1000 // 1 day
      startDate = subMonths(now, 1)
      break
    case "1y":
      dataPoints = 365
      interval = 24 * 60 * 60 * 1000 // 1 day
      startDate = subMonths(now, 12)
      break
    default:
      dataPoints = 144
      interval = 10 * 60 * 1000 // 10 minutes
      startDate = subHours(now, 24)
  }

  let currentPrice = basePrice
  let high24h = basePrice
  let low24h = basePrice

  for (let i = 0; i < dataPoints; i++) {
    // Generate realistic price movements
    const change = (Math.random() - 0.5) * volatility
    currentPrice = currentPrice * (1 + change)

    // Update 24h high/low
    if (i < 144) {
      // Only track last 24h worth of points
      high24h = Math.max(high24h, currentPrice)
      low24h = Math.min(low24h, currentPrice)
    }

    // Generate volume with some correlation to price changes
    const volumeBase = basePrice * 1000000 // Base volume proportional to price
    const volumeVariation = Math.abs(change) * volumeBase * 10 // Higher volume on bigger price moves
    const volume = volumeBase + volumeVariation + Math.random() * volumeBase

    points.push({
      timestamp: getUnixTime(new Date(startDate.getTime() + i * interval)) * 1000,
      price: currentPrice,
      volume: volume,
    })
  }

  return {
    data: points,
    high24h,
    low24h,
  }
}

