"use client"

import { useState } from "react"
import {
  Code2,
  Terminal,
  BookOpen,
  GitBranch,
  Cpu,
  Boxes,
  Network,
  Wrench,
  Copy,
  ExternalLink,
  CheckCircle2,
  Server,
  Wallet,
  Blocks,
  Activity,
  Shield,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Network Configuration
const networks = {
  mainnet: {
    name: "Mainnet",
    chainId: "0x1234",
    rpcUrl: process.env.MAINNET_RPC_URL || "https://rpc.nexis.network",
    explorerUrl: "https://explorer.nexis.network",
    currency: {
      name: "Nexis",
      symbol: "NZT",
      decimals: 18,
    },
    status: "operational",
    tps: 65000,
    blockTime: 0.4,
  },
  testnet: {
    name: "Testnet",
    chainId: "0x5678",
    rpcUrl: process.env.TESTNET_RPC_URL || "https://testnet.nexis.network",
    explorerUrl: "https://testnet.explorer.nexis.network",
    currency: {
      name: "Nexis",
      symbol: "tNZT",
      decimals: 18,
    },
    status: "operational",
    tps: 65000,
    blockTime: 0.4,
  },
}

// Add this after the networks object and before the resources object

const securityTips = [
  {
    title: "Environment Variables",
    description: "Use different private keys for development and production environments.",
    example: `// Development environment
DEVELOPMENT_PRIVATE_KEY=${process.env.DEVELOPMENT_PRIVATE_KEY?.slice(0, 6)}...
TESTNET_RPC_URL=${process.env.TESTNET_RPC_URL}

// Production environment
PRODUCTION_PRIVATE_KEY=${process.env.PRODUCTION_PRIVATE_KEY?.slice(0, 6)}...
MAINNET_RPC_URL=${process.env.MAINNET_RPC_URL}`,
  },
  {
    title: "Network Configuration",
    description: "Configure your hardhat.config.js with environment-specific settings",
    example: `// hardhat.config.js
module.exports = {
  networks: {
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: [process.env.PRODUCTION_PRIVATE_KEY],
      chainId: ${networks.mainnet.chainId}
    },
    testnet: {
      url: process.env.TESTNET_RPC_URL,
      accounts: [process.env.DEVELOPMENT_PRIVATE_KEY],
      chainId: ${networks.testnet.chainId}
    }
  }
}`,
  },
  {
    title: "Security Checks",
    description: "Implement checks to prevent accidental mainnet deployments",
    example: `// scripts/deploy.js
async function main() {
  if (network.name === 'mainnet') {
    throw new Error(
      'Mainnet deployments require additional safety checks'
    )
  }
  
  if (!process.env.DEVELOPMENT_PRIVATE_KEY) {
    throw new Error('Missing development private key')
  }

  // Continue with deployment...
}`,
  },
]

// Development Resources
const resources = {
  evm: [
    {
      title: "Hardhat Plugin",
      description: "Official Hardhat plugin for Nexis Network development",
      url: "https://github.com/nexis-network/hardhat-plugin",
      category: "tooling",
    },
    {
      title: "Web3.js Integration",
      description: "Web3.js library configured for Nexis Network",
      url: "https://github.com/nexis-network/web3js",
      category: "library",
    },
    {
      title: "Ethers.js Support",
      description: "Ethers.js library with Nexis Network support",
      url: "https://github.com/nexis-network/ethersjs",
      category: "library",
    },
  ],
  solana: [
    {
      title: "Anchor Framework",
      description: "Solana's Anchor framework configured for Nexis Network",
      url: "https://github.com/nexis-network/anchor",
      category: "framework",
    },
    {
      title: "SPL Token Library",
      description: "SPL token library for Nexis Network",
      url: "https://github.com/nexis-network/spl-token",
      category: "library",
    },
    {
      title: "Nexis CLI",
      description: "Command-line interface for Nexis Network development",
      url: "https://github.com/nexis-network/cli",
      category: "tooling",
    },
  ],
}

export default function ToolsPage() {
  const [selectedNetwork, setSelectedNetwork] = useState<"mainnet" | "testnet">("mainnet")
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      toast.error("Failed to copy")
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Developer Tools</h1>
        <p className="text-base text-muted-foreground">Build on Nexis Network using EVM and Solana development tools</p>
      </div>

      {/* Quick Start Section */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-card/50 to-card/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Quick Start
          </CardTitle>
          <CardDescription>Get started with Nexis Network development</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {/* Network Selection */}
          <div className="flex flex-wrap gap-4">
            {Object.entries(networks).map(([key, network]) => (
              <Button
                key={key}
                variant={selectedNetwork === key ? "default" : "outline"}
                className={cn("gap-2 transition-all", selectedNetwork === key && "bg-primary text-primary-foreground")}
                onClick={() => setSelectedNetwork(key as "mainnet" | "testnet")}
              >
                <Server className="h-4 w-4" />
                {network.name}
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-2",
                    network.status === "operational"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-yellow-500/10 text-yellow-500",
                  )}
                >
                  {network.status}
                </Badge>
              </Button>
            ))}
          </div>

          {selectedNetwork === "mainnet" && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 mt-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-500" />
                <h4 className="font-medium text-yellow-500">Mainnet Environment</h4>
              </div>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">
                  You are currently using the mainnet environment. Make sure to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Use PRODUCTION_PRIVATE_KEY for deployments</li>
                  <li>Implement additional safety checks</li>
                  <li>Test thoroughly on testnet first</li>
                </ul>
              </div>
            </div>
          )}

          {/* Network Stats */}
          <div className="grid gap-4 rounded-lg border bg-card/50 p-4 md:grid-cols-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                TPS
              </div>
              <div className="text-2xl font-bold">{networks[selectedNetwork].tps.toLocaleString()}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Blocks className="h-4 w-4" />
                Block Time
              </div>
              <div className="text-2xl font-bold">{networks[selectedNetwork].blockTime}s</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Chain ID
              </div>
              <div className="text-2xl font-bold">{networks[selectedNetwork].chainId}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Currency
              </div>
              <div className="text-2xl font-bold">{networks[selectedNetwork].currency.symbol}</div>
            </div>
          </div>

          {/* Network Details */}
          <div className="space-y-4 rounded-lg border bg-card/50 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Network className="h-4 w-4 text-muted-foreground" />
                  <span>RPC URL</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopy(networks[selectedNetwork].rpcUrl, "rpc")}
                >
                  {copied === "rpc" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Input value={networks[selectedNetwork].rpcUrl} readOnly />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span>Explorer URL</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopy(networks[selectedNetwork].explorerUrl, "explorer")}
                >
                  {copied === "explorer" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Input value={networks[selectedNetwork].explorerUrl} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Development Tools Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Development Tools
          </CardTitle>
          <CardDescription>Choose your preferred development environment</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="evm">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="evm" className="gap-2">
                <Cpu className="h-4 w-4" />
                EVM Development
              </TabsTrigger>
              <TabsTrigger value="solana" className="gap-2">
                <Boxes className="h-4 w-4" />
                Solana Development
              </TabsTrigger>
            </TabsList>

            <TabsContent value="evm" className="mt-6 space-y-6">
              {/* EVM Setup Guide */}
              <div className="rounded-lg border bg-card/50 p-4">
                <h3 className="mb-4 text-lg font-semibold">Setup Guide</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 justify-center">
                        1
                      </Badge>
                      <span className="font-medium">Install Dependencies</span>
                    </div>
                    <div className="rounded-md bg-muted p-4">
                      <pre className="text-sm">
                        <code>npm install --save-dev hardhat @nexis/hardhat-plugin</code>
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 justify-center">
                        2
                      </Badge>
                      <span className="font-medium">Configure Hardhat</span>
                    </div>
                    <div className="rounded-md bg-muted p-4">
                      <pre className="text-sm">
                        <code>{`// hardhat.config.js
require("@nexis/hardhat-plugin");

module.exports = {
  solidity: "0.8.19",
  networks: {
    nexis: {
      url: "${networks[selectedNetwork].rpcUrl}",
      chainId: ${networks[selectedNetwork].chainId},
      accounts: [process.env.PRIVATE_KEY]
    }
  }
}`}</code>
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 justify-center">
                        !
                      </Badge>
                      <span className="font-medium">Environment Setup</span>
                    </div>
                    <div className="rounded-md bg-muted p-4">
                      <div className="mb-2 text-sm text-muted-foreground">
                        Create a .env file and add your private key:
                      </div>
                      <pre className="text-sm">
                        <code>PRIVATE_KEY=your_private_key_here</code>
                      </pre>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Make sure to add .env to your .gitignore file to keep your private key secure.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 justify-center">
                        3
                      </Badge>
                      <span className="font-medium">Deploy Contract</span>
                    </div>
                    <div className="rounded-md bg-muted p-4">
                      <pre className="text-sm">
                        <code>npx hardhat run scripts/deploy.js --network nexis</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* EVM Resources */}
              <div className="grid gap-4 md:grid-cols-3">
                {resources.evm.map((resource) => (
                  <Card key={resource.title} className="relative overflow-hidden transition-all hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
                          "h-10 px-4 py-2",
                          "bg-primary text-primary-foreground hover:bg-primary/90",
                          "gap-2",
                        )}
                      >
                        <GitBranch className="h-4 w-4" />
                        View Repository
                      </a>
                    </CardContent>
                    <Badge variant="outline" className="absolute right-4 top-4 bg-primary/10 text-primary">
                      {resource.category}
                    </Badge>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="solana" className="mt-6 space-y-6">
              {/* Solana Setup Guide */}
              <div className="rounded-lg border bg-card/50 p-4">
                <h3 className="mb-4 text-lg font-semibold">Setup Guide</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 justify-center">
                        1
                      </Badge>
                      <span className="font-medium">Install Nexis CLI</span>
                    </div>
                    <div className="rounded-md bg-muted p-4">
                      <pre className="text-sm">
                        <code>sh -c "$(curl -sSfL https://release.nexis.network/install)"</code>
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 justify-center">
                        2
                      </Badge>
                      <span className="font-medium">Create New Project</span>
                    </div>
                    <div className="rounded-md bg-muted p-4">
                      <pre className="text-sm">
                        <code>{`nexis new my-project
cd my-project
nexis build`}</code>
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 justify-center">
                        3
                      </Badge>
                      <span className="font-medium">Deploy Program</span>
                    </div>
                    <div className="rounded-md bg-muted p-4">
                      <pre className="text-sm">
                        <code>nexis program deploy target/deploy/my_program.so</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solana Resources */}
              <div className="grid gap-4 md:grid-cols-3">
                {resources.solana.map((resource) => (
                  <Card key={resource.title} className="relative overflow-hidden transition-all hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
                          "h-10 px-4 py-2",
                          "bg-primary text-primary-foreground hover:bg-primary/90",
                          "gap-2",
                        )}
                      >
                        <GitBranch className="h-4 w-4" />
                        View Repository
                      </a>
                    </CardContent>
                    <Badge variant="outline" className="absolute right-4 top-4 bg-primary/10 text-primary">
                      {resource.category}
                    </Badge>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Best Practices
          </CardTitle>
          <CardDescription>Essential security guidelines for Nexis Network development</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {securityTips.map((tip, index) => (
              <Card key={index} className="relative overflow-hidden transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">{tip.title}</CardTitle>
                  <CardDescription>{tip.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative rounded-md bg-muted p-4">
                    <pre className="text-sm">
                      <code>{tip.example}</code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={() => handleCopy(tip.example, `security-${index}`)}
                    >
                      {copied === `security-${index}` ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documentation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Documentation & Resources
          </CardTitle>
          <CardDescription>Comprehensive guides and references for Nexis Network development</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="transition-all hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  API Reference
                </CardTitle>
                <CardDescription>Complete API documentation for Nexis Network</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="https://docs.nexis.network/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
                    "h-10 px-4 py-2",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "gap-2",
                  )}
                >
                  View Documentation
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Developer Guides
                </CardTitle>
                <CardDescription>Step-by-step guides and tutorials</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="https://docs.nexis.network/guides"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
                    "h-10 px-4 py-2",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "gap-2",
                  )}
                >
                  View Guides
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Example Projects
                </CardTitle>
                <CardDescription>Sample applications and code examples</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="https://github.com/nexis-network/examples"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
                    "h-10 px-4 py-2",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "gap-2",
                  )}
                >
                  View Examples
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

