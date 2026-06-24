// src/app/(dashboard)/brands/page.jsx

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { canManageBrands } from '@/lib/auth/permissions'
import CreateBrandModal from '@/components/brands/CreateBrandModal'
import { Skeleton } from '@/components/shared/Skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { IconMedallion } from '@/components/shared/IconMedallion'
import { MotionList, MotionItem } from '@/components/shared/motion/MotionList'

export default function BrandsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchBrands() }, [])

  async function fetchBrands() {
    try {
      const res = await fetch('/api/brands')
      const data = await res.json()
      if (res.ok) setBrands(data.brands)
    } finally {
      setLoading(false)
    }
  }

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  const canCreate = session && canManageBrands(session.user.role)

  return (
    <div className="bg-background p-8 mx-auto w-full max-w-5xl">

      <PageHeader
        eyebrow="WORKSPACE"
        title="Brands"
        lede={`${brands.length} brand${brands.length !== 1 ? 's' : ''} · select one to manage`}
        actions={
          canCreate ? (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              New brand
            </button>
          ) : null
        }
      />

      {/* Search */}
      <input
        type="text"
        placeholder="Search brands..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input mb-5 block w-60"
      />

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="surface-card editorial-rise p-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Brand icon + name */}
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="shrink-0 h-10 w-10 rounded-xl" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-3.5 w-[70%]" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
              </div>

              {/* Stats row */}
              <div className="flex gap-6 pt-3.5 border-t border-border">
                <div>
                  <Skeleton className="h-3.5 w-6" />
                  <Skeleton className="mt-1.5 h-2.5 w-12" />
                </div>
                <div>
                  <Skeleton className="h-3.5 w-10" />
                  <Skeleton className="mt-1.5 h-2.5 w-10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card flex flex-col items-center text-center p-16">
          <span className="empty-art mb-4">
            <Building2 aria-hidden="true" className="h-6 w-6" />
          </span>
          <p className="eyebrow mb-2">{search ? 'NO MATCHES' : 'NO BRANDS YET'}</p>
          <p className="text-sm text-muted-foreground mb-4">
            {search ? 'No brands match your search.' : 'Create a brand to get started.'}
          </p>
          {canCreate && !search && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Create your first brand
            </button>
          )}
        </div>
      ) : (
        <MotionList className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
          {filtered.map((brand) => (
            <MotionItem
              key={brand._id}
              onClick={() => router.push(`/brands/${brand._id}`)}
              className="surface-card surface-card-hover p-5 cursor-pointer"
            >
              {/* Brand icon + name */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-white font-bold text-base shrink-0"
                  style={{ background: brand.color || '#4f46e5' }}
                >
                  {brand.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {brand.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Created by {brand.createdBy?.name || '—'}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex gap-4 pt-3.5 border-t border-border">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {brand.memberCount}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-px">
                    members
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {new Date(brand.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-px">
                    created
                  </div>
                </div>
              </div>
            </MotionItem>
          ))}
        </MotionList>
      )}

      {showModal && (
        <CreateBrandModal
          onClose={() => setShowModal(false)}
          onCreated={(b) => {
            setBrands((prev) => [b, ...prev])
            router.push(`/brands/${b._id}`)
          }}
        />
      )}
    </div>
  )
}
