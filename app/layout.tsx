import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3AuthProvider } from "@/lib/web3auth"
import { WalletProvider } from "@/lib/wallet-provider"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nexis Dashboard",
  description: "Dashboard for Nexis Protocol",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider>
            <Web3AuthProvider>
              {children}
              <Toaster position="top-right" />
            </Web3AuthProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

