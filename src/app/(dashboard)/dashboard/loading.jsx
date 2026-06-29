// src/app/(dashboard)/dashboard/loading.jsx
'use client'

import { motion } from 'motion/react'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full"
        />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-sm text-muted-foreground"
        >
          Loading dashboard...
        </motion.p>
      </motion.div>
    </div>
  )
}
