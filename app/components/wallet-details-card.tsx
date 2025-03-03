import { useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWeb3Auth } from '@/lib/web3auth'
import useFetchWalletDetails from '@/lib/hooks/use-wallet-details'

export function WalletDetailsCard() {
  const { isConnected, walletAddress } = useWeb3Auth()
  const { walletDetails, loading, error, fetchWalletDetails } = useFetchWalletDetails()

  useEffect(() => {
    if (isConnected && walletAddress) {
      fetchWalletDetails()
    }
  }, [isConnected, walletAddress, fetchWalletDetails])

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Details</CardTitle>
          <CardDescription>Connect your wallet to view details</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Details</CardTitle>
          <CardDescription>Loading wallet information...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[220px]" />
          <Skeleton className="h-4 w-[180px]" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Wallet Details</CardTitle>
          <CardDescription>There was a problem loading your wallet information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error.message}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => fetchWalletDetails(true)}>Retry</Button>
        </CardFooter>
      </Card>
    )
  }

  if (!walletDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Details</CardTitle>
          <CardDescription>No wallet information available</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => fetchWalletDetails(true)}>Refresh</Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Details</CardTitle>
        <CardDescription>
          Overview of your wallet portfolio and activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total Value</span>
          <span className="text-lg font-medium">${walletDetails.networth.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Native Balance</span>
          <span className="font-medium">${walletDetails.nativeNetworth.toLocaleString()}</span>
        </div>
        
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Wallet Profile</span>
          <div className="flex flex-wrap gap-2">
            {walletDetails.walletAge > 0 && (
              <Badge variant="outline">{walletDetails.walletAge} days old</Badge>
            )}
            {walletDetails.isWhale && (
              <Badge variant="secondary">Whale</Badge>
            )}
            {walletDetails.earlyAdopter && (
              <Badge variant="secondary">Early Adopter</Badge>
            )}
            {walletDetails.multiChainer && (
              <Badge variant="secondary">Multi-Chain</Badge>
            )}
            {walletDetails.isFresh && (
              <Badge variant="secondary">New Wallet</Badge>
            )}
            {walletDetails.ens && (
              <Badge>{walletDetails.ens}</Badge>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => fetchWalletDetails(true)}>
          Refresh Data
        </Button>
      </CardFooter>
    </Card>
  )
} 