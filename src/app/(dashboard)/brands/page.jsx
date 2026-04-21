// src/app/(dashboard)/brands/page.jsx

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canManageBrands } from '@/lib/auth/permissions'
import CreateBrandModal from '@/components/brands/CreateBrandModal'

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
    <div style={{ padding: '40px', maxWidth: '1000px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', letterSpacing: '-0.01em' }}>
            Brands
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            {brands.length} brand{brands.length !== 1 ? 's' : ''} · select one to manage
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#fff',
              background: '#4f46e5',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#4338ca')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#4f46e5')}
          >
            New brand
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search brands..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '240px',
          padding: '8px 12px',
          fontSize: '13px',
          color: '#111827',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          outline: 'none',
          marginBottom: '20px',
          display: 'block',
        }}
        onFocus={(e) => {
          e.target.style.border = '1px solid #4f46e5'
          e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'
        }}
        onBlur={(e) => {
          e.target.style.border = '1px solid #e5e7eb'
          e.target.style.boxShadow = 'none'
        }}
      />

      {/* Grid */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
          Loading brands...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: '64px',
            textAlign: 'center',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '12px' }}>
            {search ? 'No brands match your search.' : 'No brands yet.'}
          </div>
          {canCreate && !search && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#4f46e5',
                background: '#ede9fe',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Create your first brand
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          {filtered.map((brand) => (
            <div
              key={brand._id}
              onClick={() => router.push(`/brands/${brand._id}`)}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#c7d2fe'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(79,70,229,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Brand icon + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: brand.color || '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}
                >
                  {brand.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {brand.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                    Created by {brand.createdBy?.name || '—'}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  paddingTop: '14px',
                  borderTop: '1px solid #f3f4f6',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    {brand.memberCount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                    members
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    {new Date(brand.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                    created
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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