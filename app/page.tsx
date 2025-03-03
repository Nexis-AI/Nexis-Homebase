"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import dynamic from 'next/dynamic'

// Dynamically import the Spline component with SSR disabled to avoid client/server mismatch
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[300px] flex items-center justify-center text-white/50">Loading 3D scene...</div>
})

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black overflow-hidden relative">
      {/* Feature tags at the top */}
      <div className="absolute top-8 left-0 right-0 flex justify-between px-8 md:px-12 z-20 text-white/70 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/30" />
          <span>next-gen experience</span>
        </div>
        <div className="flex items-center gap-2">
          <span>serverless architecture</span>
          <div className="w-2 h-2 rounded-full bg-white/30" />
        </div>
      </div>
      
      {/* Spline component positioned absolutely to overlay the text */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <Spline
          scene="https://prod.spline.design/hWzFnhFNk-E6BGXL/scene.splinecode"
        />
      </div>
      
      {/* Navigation buttons positioned at the bottom */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-between px-8 md:px-12 z-20">
        <div className="flex flex-col gap-4">
          {/* Description text moved above buttons and aligned left */}
          <motion.div
            className="text-left mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            <h2 className="text-white/90 text-xl mb-2">
              <span className="font-bold">Nexis AI</span> The next generation AI platform.
            </h2>
            <p className="text-white/70 text-sm md:text-base">
              The easiest way to build intelligent, autonomous AI agents with advanced memory.<br/>
              Start building today with one-click deployment.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex gap-3"
          >
            <Link href="/dashboard" className="bg-white text-black rounded-md px-6 py-2 font-medium hover:bg-opacity-90 transition-all duration-300 inline-flex items-center">
              <span>Get Started</span>
            </Link>
            
            {/* "Learn More" button moved to the left */}
            <Link 
              href="https://docs.nexis.network" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-[#272729] text-white rounded-md px-6 py-2 font-medium hover:bg-[#272729]/80 hover:bg-opacity-10 transition-all duration-300 inline-flex items-center"
            >
              <span>Learn Nexis</span>
            </Link>
          </motion.div>
          
          {/* Command line style text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-white/50 text-xs flex items-center gap-2"
          >
            <span className="font-mono">$</span>
            <span className="font-mono">npx nexis-ai init</span>
          </motion.div>
        </div>
        
        <div className="flex flex-col items-end gap-4">
          {/* Feature tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-white/50 text-xs"
          >
            <span>agents | memory | tools | modules</span>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

