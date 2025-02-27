export interface TokenMetrics {
  price: number
  priceChange: number
  marketCap: number
  volume24h: number
  circulatingSupply: number
  totalSupply: number
  stakingAPY: number
  totalStaked: number
  holders: number
  liquidityDepth: number
  volatility30d: number
}

export interface NetworkStats {
  totalTransactions: number
  avgGasPrice: number
  blockTime: number
  activeValidators: number
  networkStaking: number
  networkAPY: number
}

export interface VestingSchedule {
  name: string
  cliff: string
  duration: string
  tge: string
  total: number
  unlocked: number
  data: VestingData[]
  vestingType: "Linear" | "Exponential" | "Milestone"
  cliffEnd: string
  nextUnlock: string
  category: "Team" | "Advisors" | "Public" | "Partners" | "Treasury"
}

export interface VestingData {
  month: string
  amount: number
  unlocked: number
  status: string
  date: string
  milestone?: string
}

export interface StakingTier {
  name: string
  minimumStake: number
  apy: number
  lockPeriod: number
  rewards: string[]
  multiplier: number
}

export interface GovernanceStats {
  totalProposals: number
  activeProposals: number
  totalVotes: number
  quorum: number
  avgVoterParticipation: number
  treasurySize: number
}

export interface TokenUtility {
  feature: string
  description: string
  requiredAmount: number
  status: "Active" | "Coming Soon" | "Deprecated"
  benefits: string[]
}

export interface RiskMetrics {
  impermanentLoss30d: number
  volatility30d: number
  sharpeRatio: number
  marketBeta: number
  liquidityScore: number
}

