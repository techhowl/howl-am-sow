// src/app/(dashboard)/dashboard/loading.jsx
'use client'

import { Skeleton, SkeletonStatCards, SkeletonTable, SkeletonList } from '@/components/shared/Skeleton'

// Layout-matching skeleton for the dashboard route (server component blocks on
// DB queries). Mirrors the shared shape of both Admin and Employee dashboards:
// header → 3 stat cards → (2/3 list card) + (1/3 side card).
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-8">

      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2 h-3 w-40" />
      </div>

      {/* Stat cards — matches grid-cols-3 metric row */}
      <SkeletonStatCards count={3} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Primary list card (Recent Tasks / My Tasks) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <SkeletonTable rows={6} className="border-0" />
        </div>

        {/* Side column (Quick Links / Brands) */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <Skeleton className="mb-4 h-4 w-24" />
          <SkeletonList rows={4} />
        </div>
      </div>
    </div>
  )
}
