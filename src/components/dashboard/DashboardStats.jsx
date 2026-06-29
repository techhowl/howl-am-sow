'use client';

import { AnimatedStatCard } from '@/components/shared/AnimatedStatCard';
import { Layers, Zap, Clock, CheckCircle2, RotateCcw } from 'lucide-react';

export function AdminDashboardStats({ activeBrands, liveTasks, pendingTasks }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <AnimatedStatCard
        label="Active Brands"
        value={activeBrands}
        icon={Layers}
        tone="--primary"
        href="/brands"
        showGradient={true}
      />
      <AnimatedStatCard
        label="Tasks Live"
        value={liveTasks}
        icon={Zap}
        tone="--success"
        showGradient={liveTasks > 20}
      />
      <AnimatedStatCard
        label="Pending Review"
        value={pendingTasks}
        icon={Clock}
        tone="--warning"
        href="/timeline"
        showGradient={pendingTasks > 5}
      />
    </div>
  );
}

export function EmployeeDashboardStats({ myPending, myLive, myRejected }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <AnimatedStatCard
        label="My Active Tasks"
        value={myPending}
        icon={Clock}
        tone="--primary"
        showGradient={myPending > 0}
      />
      <AnimatedStatCard
        label="Completed (Live)"
        value={myLive}
        icon={CheckCircle2}
        tone="--success"
        showGradient={myLive > 10}
      />
      <AnimatedStatCard
        label="Needs Revision"
        value={myRejected}
        icon={RotateCcw}
        tone="--destructive"
        showGradient={myRejected > 0}
      />
    </div>
  );
}
