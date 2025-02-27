import { subHours, subDays, subMonths, getUnixTime } from "date-fns"

interface ChartDataPoint {
  date: string
  price: number
}

interface GeneratedChartData {
  data: ChartDataPoint[]
  startPrice: number
  endPrice: number
  highPrice: number
  lowPrice: number
  priceChange: number
  priceChangePercentage: number
}

/**
 * Generates sample chart data for token price visualization
 * @param basePrice - The base price to generate data around
 * @param volatility - The volatility factor (0-1) to use for price variations
 * @param dataPoints - Number of data points to generate
 * @returns Chart data with statistics
 */
export function generateChartData(
  basePrice: number,
  volatility = 0.05,
  dataPoints = 24
): GeneratedChartData {
  const data: ChartDataPoint[] = []
  let highPrice = basePrice
  let lowPrice = basePrice
  const now = new Date()
  
  // Generate data points for last 24 hours
  for (let i = 0; i < dataPoints; i++) {
    // Calculate time point (going backward from now)
    const timePoint = new Date(now.getTime() - (dataPoints - i - 1) * (24 * 60 * 60 * 1000 / dataPoints))
    
    // Random price fluctuation based on volatility
    const randomFactor = 1 + (Math.random() * volatility * 2 - volatility)
    const price = i === 0 
      ? basePrice 
      : data[i-1].price * randomFactor
    
    // Update high and low prices
    if (price > highPrice) highPrice = price
    if (price < lowPrice) lowPrice = price
    
    // Add data point
    data.push({
      date: timePoint.toISOString(),
      price
    })
  }
  
  const startPrice = data[0].price
  const endPrice = data[data.length - 1].price
  const priceChange = endPrice - startPrice
  const priceChangePercentage = (priceChange / startPrice) * 100
  
  return {
    data,
    startPrice,
    endPrice,
    highPrice,
    lowPrice,
    priceChange,
    priceChangePercentage
  }
}

