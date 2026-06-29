'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Search } from 'lucide-react';
import { canManageBrands } from '@/lib/auth/permissions';
import CreateBrandModal from '@/components/brands/CreateBrandModal';
import { PageHeader } from '@/components/shared/PageHeader';
import { AnimatedGradient } from '@/components/ui/animated-gradient-with-svg';

// Brand card with smooth animations
function BrandCard({ brand, index }) {
  const router = useRouter();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      onClick={() => router.push(`/brands/${brand._id}`)}
      className="surface-card surface-card-hover p-5 cursor-pointer relative overflow-hidden group"
    >
      {/* Animated gradient on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <AnimatedGradient 
          colors={[
            brand.color || 'oklch(0.52 0.17 300)',
            `color-mix(in oklab, ${brand.color || 'oklch(0.52 0.17 300)'} 60%, oklch(0.60 0.12 268))`,
            `color-mix(in oklab, ${brand.color || 'oklch(0.52 0.17 300)'} 40%, oklch(0.68 0.15 355))`
          ]}
          speed={0.03}
          blur="medium"
        />
        <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent" />
      </div>
      
      {/* Brand content */}
      <div className="relative z-10">
        {/* Brand icon + name */}
        <div className="flex items-center gap-3 mb-4">
          <motion.span
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-white font-bold text-base shrink-0 glass-thick"
            style={{ background: brand.color || '#4f46e5' }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {brand.name.charAt(0).toUpperCase()}
          </motion.span>
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.2 }}
          >
            <div className="text-sm font-semibold text-foreground">
              {brand.memberCount}
            </div>
            <div className="text-[11px] text-muted-foreground mt-px">
              members
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.3 }}
          >
            <div className="text-sm font-semibold text-foreground">
              {new Date(brand.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </div>
            <div className="text-[11px] text-muted-foreground mt-px">
              created
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Empty state with animated gradient
function EmptyState({ search, canCreate, onCreateClick }) {
  return (
    <motion.div 
      className="surface-card flex flex-col items-center text-center p-16 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {!search && (
        <>
          <AnimatedGradient 
            colors={['oklch(0.52 0.17 300)', 'oklch(0.60 0.12 268)', 'oklch(0.68 0.15 355)']}
            speed={0.02}
            blur="medium"
          />
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none" />
        </>
      )}
      <motion.div 
        className="relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.span 
          className="empty-art mb-4"
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            repeatDelay: 2
          }}
        >
          <Building2 aria-hidden="true" className="h-6 w-6" />
        </motion.span>
        <p className="eyebrow mb-2">{search ? 'NO MATCHES' : 'NO BRANDS YET'}</p>
        <p className="text-sm text-muted-foreground mb-4">
          {search ? 'No brands match your search.' : 'Create a brand to get started.'}
        </p>
        {canCreate && !search && (
          <motion.button 
            onClick={onCreateClick} 
            className="btn-primary gloss"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={16} />
            Create your first brand
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

// Search bar with animations
function SearchBar({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  
  return (
    <motion.div 
      className="relative w-60"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Search 
        size={16} 
        className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
          focused ? 'text-primary' : 'text-muted-foreground'
        }`}
      />
      <input
        type="text"
        placeholder="Search brands..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="input pl-9 w-full"
      />
    </motion.div>
  );
}

export default function BrandsClient() {
  const { data: session } = useSession();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchBrands() }, []);

  async function fetchBrands() {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      if (res.ok) setBrands(data.brands);
    } finally {
      setLoading(false);
    }
  }

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = session && canManageBrands(session.user.role);

  return (
    <motion.div 
      className="bg-background p-8 mx-auto w-full max-w-5xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <PageHeader
        eyebrow="WORKSPACE"
        title="Brands"
        lede={`${brands.length} brand${brands.length !== 1 ? 's' : ''} · select one to manage`}
        actions={
          canCreate ? (
            <motion.button 
              onClick={() => setShowModal(true)} 
              className="btn-primary gloss"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Plus size={16} />
              New brand
            </motion.button>
          ) : null
        }
      />

      {/* Search */}
      <div className="mb-5">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center py-20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </motion.div>
        ) : filtered.length === 0 ? (
          <EmptyState 
            key="empty"
            search={search} 
            canCreate={canCreate} 
            onCreateClick={() => setShowModal(true)} 
          />
        ) : (
          <motion.div 
            key="grid"
            className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {filtered.map((brand, index) => (
              <BrandCard key={brand._id} brand={brand} index={index} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {showModal && (
        <CreateBrandModal
          onClose={() => setShowModal(false)}
          onCreated={(b) => {
            setBrands((prev) => [b, ...prev]);
            setShowModal(false);
          }}
        />
      )}
    </motion.div>
  );
}
