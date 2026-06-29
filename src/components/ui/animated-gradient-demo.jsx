import React from "react"
import { motion } from "framer-motion"
import { 
  TrendingUp, 
  Users, 
  Target, 
  Briefcase, 
  Star,
  Activity
} from "lucide-react"

import { AnimatedGradient } from "@/components/ui/animated-gradient-with-svg"

const BentoCard = ({
  title,
  value,
  subtitle,
  colors,
  delay,
  icon: Icon,
  trend,
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay + 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] // --ease-glass from your theme
      } 
    },
  }

  return (
    <motion.div
      className="relative overflow-hidden h-full glass"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      <AnimatedGradient colors={colors} speed={0.05} blur="medium" />
      
      {/* Glass surface enhancement */}
      <div className="absolute inset-0 bg-linear-to-br from-white/8 to-transparent pointer-events-none" />
      
      <motion.div
        className="relative z-10 p-6 md:p-8 h-full flex flex-col"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div 
          className="flex items-start justify-between mb-4"
          variants={item}
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="empty-art w-12 h-12">
                <Icon size={20} />
              </div>
            )}
            <h3 className="text-sm font-medium text-foreground/80">
              {title}
            </h3>
          </div>
          {trend && (
            <motion.div 
              className={cn(
                "chip text-xs",
                trend > 0 ? "data-[tone=success]" : "data-[tone=warning]"
              )}
              data-tone={trend > 0 ? "success" : "warning"}
              whileHover={{ scale: 1.05 }}
            >
              <TrendingUp size={12} className={trend < 0 ? "rotate-180" : ""} />
              {Math.abs(trend)}%
            </motion.div>
          )}
        </motion.div>
        
        <motion.div className="flex-1" variants={item}>
          <p className="text-3xl md:text-4xl font-display font-bold mb-2 glass-title">
            {value}
          </p>
        </motion.div>
        
        {subtitle && (
          <motion.p 
            className="text-sm text-muted-foreground mt-auto"
            variants={item}
          >
            {subtitle}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  )
}

const AnimatedGradientDemo = () => {
  return (
    <div className="w-full min-h-screen p-4 md:p-8">
      {/* Header */}
      <motion.div 
        className="max-w-7xl mx-auto mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-8 bg-primary rounded-full" />
          <h1 className="editorial-h1">Analytics Dashboard</h1>
        </div>
        <p className="editorial-lede">
          Real-time insights and performance metrics for your brand campaigns
        </p>
      </motion.div>

      {/* Bento Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[250px]">
          {/* Large card - spans 2 columns */}
          <div className="md:col-span-2">
            <BentoCard
              title="Campaign Performance"
              value="$1,234,567"
              subtitle="Total revenue across all active campaigns"
              colors={["oklch(0.52 0.17 300)", "oklch(0.60 0.12 268)", "oklch(0.68 0.15 355)"]}
              icon={Briefcase}
              trend={15}
              delay={0.2}
            />
          </div>
          
          {/* Single card */}
          <BentoCard
            title="Active Users"
            value="12,345"
            subtitle="Currently online"
            colors={["oklch(0.60 0.12 268)", "oklch(0.74 0.16 165)", "oklch(0.68 0.15 355)"]}
            icon={Users}
            trend={8}
            delay={0.3}
          />
          
          {/* Single card */}
          <BentoCard
            title="Conversion Rate"
            value="4.28%"
            subtitle="vs 3.45% last month"
            colors={["oklch(0.68 0.15 45)", "oklch(0.68 0.16 300)", "oklch(0.68 0.15 40)"]}
            icon={Target}
            trend={24}
            delay={0.4}
          />
          
          {/* Large card - spans 2 columns */}
          <div className="md:col-span-2">
            <BentoCard
              title="Brand Health Score"
              value="92/100"
              subtitle="Excellent performance across engagement, reach, and sentiment"
              colors={["oklch(0.52 0.17 300)", "oklch(0.74 0.10 268)", "oklch(0.80 0.13 355)"]}
              icon={Activity}
              delay={0.5}
            />
          </div>
          
          {/* Wide card - spans 3 columns */}
          <div className="md:col-span-3">
            <BentoCard
              title="Customer Satisfaction"
              value="4.8/5"
              subtitle="Based on 1,000+ reviews from verified customers across all product categories this quarter"
              colors={["oklch(0.66 0.22 20)", "oklch(0.80 0.13 355)", "oklch(0.52 0.17 300)"]}
              icon={Star}
              trend={12}
              delay={0.6}
            />
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <motion.div 
        className="max-w-7xl mx-auto mt-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <button className="btn-primary gloss">
          <Activity size={16} />
          View Detailed Analytics
        </button>
      </motion.div>
    </div>
  )
}

// Helper function for conditional classes
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

export { AnimatedGradientDemo }
