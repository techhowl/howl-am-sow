'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Layers, Zap, Clock, CheckCircle2, RotateCcw, 
  ArrowRight, AlertCircle, Building2 
} from 'lucide-react';
import { AnimatedGradient } from '@/components/ui/animated-gradient-with-svg';
import { PageHeader } from '@/components/shared/PageHeader';
import { IconMedallion } from '@/components/shared/IconMedallion';
import { AnimatedNumber } from '@/components/shared/motion/AnimatedNumber';
import { MotionList, MotionItem } from '@/components/shared/motion/MotionList';

// Enhanced stat card with smooth gradient animation
function AnimatedStatCard({ 
  label, 
  value, 
  icon, 
  tone = '--primary', 
  href, 
  showGradient = false,
  gradientColors,
  delay = 0 
}) {
  // Default gradient colors based on tone
  const defaultColors = {
    '--primary': ['oklch(0.52 0.17 300)', 'oklch(0.60 0.12 268)', 'oklch(0.68 0.15 355)'],
    '--success': ['oklch(0.60 0.16 165)', 'oklch(0.74 0.16 165)', 'oklch(0.68 0.15 355)'],
    '--warning': ['oklch(0.68 0.15 45)', 'oklch(0.82 0.14 50)', 'oklch(0.68 0.16 300)'],
    '--destructive': ['oklch(0.56 0.22 20)', 'oklch(0.66 0.22 20)', 'oklch(0.68 0.15 355)'],
  };
  
  const colors = gradientColors || defaultColors[tone] || defaultColors['--primary'];
  
  const cardContent = (
    <motion.div
      className="surface-card surface-card-hover group h-full cursor-pointer relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ y: -4 }}
    >
      {showGradient && (
        <>
          <AnimatedGradient colors={colors} speed={0.03} blur="medium" />
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none" />
        </>
      )}
      
      <div className="relative z-10 p-5">
        <div className="mb-4 flex items-center justify-between">
          <IconMedallion icon={icon} tone={tone} />
          {href && (
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </div>
        <p className="mb-1 text-3xl font-semibold tracking-tight text-foreground tabular-nums glass-title">
          <AnimatedNumber value={value} />
        </p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
  
  if (href) return <Link href={href} className="block focus-visible:outline-none">{cardContent}</Link>;
  return cardContent;
}

// Task item with smooth hover effects
function TaskItem({ task, index }) {
  const STATUS_LABELS = {
    copy_wip: 'Copy WIP',
    video_wip: 'Video WIP',
    design_wip: 'Design WIP',
    internal_review: 'Internal Review',
    sent_to_client: 'Sent to Client',
    approved: 'Approved',
    rejected: 'Rejected',
    live: 'Live',
  };

  const STATUS_COLORS = {
    copy_wip: 'bg-[--color-chart-4]/15 text-[--color-chart-4]',
    video_wip: 'bg-[--color-chart-5]/15 text-[--color-chart-5]',
    design_wip: 'bg-[--color-chart-2]/15 text-[--color-chart-2]',
    internal_review: 'bg-warning/10 text-warning',
    sent_to_client: 'bg-[--color-chart-1]/15 text-[--color-chart-1]',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive',
    live: 'bg-success/10 text-success',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`flex items-center justify-between px-3 py-3 rounded-xl transition-all hover:scale-[1.02] ${
        task.status === 'rejected'
          ? 'bg-destructive/10 border border-destructive/30'
          : 'hover:bg-muted'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {task.status === 'rejected' && (
          <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
        )}
        {task.brandId?.color && task.status !== 'rejected' && (
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: task.brandId.color }}
          />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
          {task.brandId?.name && (
            <p className="text-xs text-muted-foreground mt-0.5">{task.brandId.name}</p>
          )}
        </div>
      </div>
      <span className={`text-xs font-medium ml-3 shrink-0 px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] || 'bg-muted text-muted-foreground'}`}>
        {STATUS_LABELS[task.status] || task.status}
      </span>
    </motion.div>
  );
}

// Brand card with gradient on hover
function BrandCard({ brand, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      <Link
        href={`/brands/${brand._id}/tasks`}
        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <AnimatedGradient 
            colors={[
              brand.color || 'oklch(0.52 0.17 300)',
              `color-mix(in oklab, ${brand.color || 'oklch(0.52 0.17 300)'} 70%, transparent)`,
              'transparent'
            ]}
            speed={0.02}
            blur="heavy"
          />
        </div>
        <div className="relative z-10 flex items-center gap-3 w-full">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 glass-thick"
            style={{ background: brand.color || '#4f46e5' }}
          >
            {brand.name?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground truncate flex-1">
            {brand.name}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}

// Employee dashboard
export function EmployeeDashboardClient({ 
  firstName, 
  role, 
  roleLabel,
  myPending, 
  myLive, 
  myRejected,
  myTasks,
  myBrands 
}) {
  return (
    <div className="min-h-screen bg-background p-8">
      <PageHeader
        eyebrow="DASHBOARD"
        title={`Welcome back, ${firstName}`}
        lede={`${roleLabel} · SOW Tracker`}
      />

      {/* Animated stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <AnimatedStatCard
          label="My Active Tasks"
          value={myPending}
          icon={Clock}
          tone="--primary"
          showGradient={myPending > 0}
          delay={0.1}
        />
        <AnimatedStatCard
          label="Completed (Live)"
          value={myLive}
          icon={CheckCircle2}
          tone="--success"
          showGradient={myLive > 10}
          delay={0.2}
        />
        <AnimatedStatCard
          label="Needs Revision"
          value={myRejected}
          icon={RotateCcw}
          tone="--destructive"
          showGradient={myRejected > 0}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* My Tasks with animation */}
        <motion.div 
          className="lg:col-span-2 surface-card p-5 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Subtle gradient for task section */}
          {myTasks.length > 5 && (
            <>
              <AnimatedGradient 
                colors={['oklch(0.52 0.17 300 / 0.1)', 'oklch(0.60 0.12 268 / 0.1)', 'transparent']}
                speed={0.01}
                blur="heavy"
              />
            </>
          )}
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">My Tasks</h2>
              <Link href="/timeline" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                View timeline →
              </Link>
            </div>

            {myTasks.length === 0 ? (
              <div className="flex flex-col items-center text-center py-12">
                <span className="empty-art mb-4"><CheckCircle2 className="h-6 w-6" /></span>
                <p className="eyebrow mb-2">NOTHING YET</p>
                <p className="text-sm text-muted-foreground max-w-xs">No active tasks assigned to you</p>
                <p className="text-xs text-muted-foreground mt-1">Your manager will assign tasks to you soon</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {myTasks.map((task, idx) => (
                  <TaskItem key={task._id} task={task} index={idx} />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Side panels */}
        <div className="flex flex-col gap-4">
          {/* My Brands */}
          <motion.div 
            className="surface-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-sm font-semibold text-foreground mb-3">My Brands</h2>
            {myBrands.length === 0 ? (
              <p className="text-xs text-muted-foreground">Not assigned to any brand yet</p>
            ) : (
              <div className="space-y-2">
                {myBrands.map((brand, idx) => (
                  <BrandCard key={brand._id} brand={brand} index={idx} />
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick links */}
          <motion.div 
            className="surface-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2 className="text-sm font-semibold text-foreground mb-3">Quick Links</h2>
            <div className="space-y-1.5">
              {[
                { href: '/brands', label: 'Brands', desc: 'Your workspaces' },
                { href: '/timeline', label: 'Timeline', desc: 'All deadlines' },
              ].map((link, idx) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:bg-muted hover:border-border transition-all group"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{link.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{link.desc}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Admin dashboard
export function AdminDashboardClient({ 
  firstName, 
  role, 
  roleLabel,
  activeBrands, 
  liveTasks, 
  pendingTasks,
  recentTasks 
}) {
  return (
    <div className="min-h-screen bg-background p-8">
      <PageHeader
        eyebrow="DASHBOARD"
        title={`Welcome back, ${firstName}`}
        lede={`${roleLabel} · SOW Tracker`}
      />

      {/* Stat cards with gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <AnimatedStatCard
          label="Active Brands"
          value={activeBrands}
          icon={Layers}
          tone="--primary"
          href="/brands"
          showGradient={true}
          delay={0.1}
        />
        <AnimatedStatCard
          label="Tasks Live"
          value={liveTasks}
          icon={Zap}
          tone="--success"
          showGradient={liveTasks > 20}
          delay={0.2}
        />
        <AnimatedStatCard
          label="Pending Review"
          value={pendingTasks}
          icon={Clock}
          tone="--warning"
          href="/timeline"
          showGradient={pendingTasks > 5}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent tasks with subtle gradient */}
        <motion.div 
          className="lg:col-span-2 surface-card p-5 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {recentTasks.length > 3 && (
            <AnimatedGradient 
              colors={['oklch(0.52 0.17 300 / 0.05)', 'oklch(0.60 0.12 268 / 0.05)', 'transparent']}
              speed={0.01}
              blur="heavy"
            />
          )}
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Recent Tasks</h2>
              <Link href="/brands" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                View all →
              </Link>
            </div>
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
            ) : (
              <div className="space-y-1">
                {recentTasks.map((task, idx) => (
                  <TaskItem key={task._id} task={task} index={idx} />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick links with gradient hover */}
        <motion.div 
          className="surface-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-sm font-semibold text-foreground mb-4">Quick Links</h2>
          <div className="space-y-2">
            {[
              { href: '/brands', label: 'Brands', desc: 'Manage workspaces', icon: Building2, color: 'oklch(0.52 0.17 300)' },
              { href: '/timeline', label: 'Timeline', desc: 'Cross-brand deadlines', icon: Clock, color: 'oklch(0.68 0.15 45)' },
              { href: '/analytics', label: 'Analytics', desc: 'Performance & stats', icon: Zap, color: 'oklch(0.60 0.16 165)' },
              { href: '/users', label: 'Users', desc: 'Team management', icon: Layers, color: 'oklch(0.74 0.10 268)' },
            ].map((link, idx) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
              >
                <Link
                  href={link.href}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted hover:border-border transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <AnimatedGradient 
                      colors={[link.color, `color-mix(in oklab, ${link.color} 50%, transparent)`, 'transparent']}
                      speed={0.02}
                      blur="heavy"
                    />
                  </div>
                  <div className="relative z-10 flex items-center gap-3 flex-1">
                    <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{link.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{link.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity relative z-10" />
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="h-px bg-border mt-5 mb-4" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Head to <span className="text-primary">Brands</span> to manage workspaces and assign tasks.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
