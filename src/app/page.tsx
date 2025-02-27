"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-8">
        <motion.h1
          className="text-6xl font-bold tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Welcome
        </motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <Link href="/dashboard" className="group relative inline-block px-8 py-3 text-lg font-medium">
            <span className="relative z-10">Enter</span>
            {/* Top left corner */}
            <span className="absolute left-0 top-0 h-[1px] w-8 bg-white transition-all duration-300 group-hover:w-full" />
            <span className="absolute left-0 top-0 h-8 w-[1px] bg-white transition-all duration-300 group-hover:h-full" />
            {/* Top right corner */}
            <span className="absolute right-0 top-0 h-[1px] w-8 bg-white transition-all duration-300 group-hover:w-full" />
            <span className="absolute right-0 top-0 h-8 w-[1px] bg-white transition-all duration-300 group-hover:h-full" />
            {/* Bottom borders - initially transparent */}
            <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-white transition-all duration-300 group-hover:w-full" />
            <span className="absolute bottom-0 left-0 h-0 w-[1px] bg-white transition-all duration-300 group-hover:h-full" />
            <span className="absolute bottom-0 right-0 h-0 w-[1px] bg-white transition-all duration-300 group-hover:h-full" />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

