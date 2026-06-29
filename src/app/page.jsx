'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowRight, Sparkles, Zap, Users, BarChart3, CheckCircle2, 
  Layers, Clock, TrendingUp, Shield, Globe, Palette,
  ChevronRight, Play, Star, Menu, X
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { AnimatedGradientWrapper as AnimatedGradient } from '@/components/ui/animated-gradient-wrapper';
import { AnimatedNumber } from '@/components/shared/motion/AnimatedNumber';
import { cn } from '@/lib/utils';

// Navigation component
function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-thick py-4' : 'py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Logo variant="full" size={32} />
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="btn-ghost">
            Sign In
          </Link>
          <Link href="/login" className="btn-primary gloss">
            <Sparkles size={16} />
            Get Started
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className="p-2 text-foreground"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-thick mt-4 mx-4 rounded-2xl overflow-hidden"
          >
            <div className="p-6 space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-4 border-t border-border space-y-3">
                <Link href="/login" className="btn-ghost w-full justify-center">
                  Sign In
                </Link>
                <Link href="/login" className="btn-primary gloss w-full justify-center">
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// Hero section with animated gradient
function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <AnimatedGradient 
          colors={[
            'oklch(0.52 0.17 300)',
            'oklch(0.60 0.12 268)', 
            'oklch(0.68 0.15 355)',
            'oklch(0.72 0.15 40)'
          ]}
          speed={0.01}
          blur="medium"
        />
      </div>
      
      {/* Glass overlay for better readability */}
      <div className="absolute inset-0 bg-background/30 backdrop-blur-sm" />
      
      <motion.div 
        style={{ y, opacity }}
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-thin mb-8"
        >
          <Sparkles size={16} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Introducing Howl SOW Tracker</span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6 glass-title"
        >
          Transform Your Agency's
          <span className="block text-transparent bg-clip-text bg-linear-to-r from-primary via-accent-2 to-accent-3">
            Workflow Management
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10"
        >
          Track scope of work, manage tasks, and deliver projects on time with the most beautiful 
          workflow management system designed specifically for creative agencies.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/login" className="btn-primary gloss text-lg px-8 py-4 group">
            Start Free Trial
            <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="btn-ghost text-lg px-8 py-4 group">
            <Play size={20} className="mr-2" />
            Watch Demo
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          {[
            { value: 150, suffix: '+', label: 'Agencies' },
            { value: 10000, suffix: '+', label: 'Tasks Tracked' },
            { value: 98, suffix: '%', label: 'On-Time Delivery' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-foreground">
                <AnimatedNumber value={stat.value} />
                {stat.suffix}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-muted rounded-full flex justify-center">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-1 h-3 bg-muted-foreground rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  );
}

// Features section with bento grid
function FeaturesSection() {
  const features = [
    {
      icon: Layers,
      title: 'Brand Management',
      description: 'Organize all your clients in one beautiful interface',
      color: 'oklch(0.52 0.17 300)',
      size: 'large',
    },
    {
      icon: Clock,
      title: 'Real-time Tracking',
      description: 'Monitor project progress with live updates',
      color: 'oklch(0.60 0.12 268)',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Assign tasks and track team performance',
      color: 'oklch(0.68 0.15 355)',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Get insights into revenue and delivery metrics',
      color: 'oklch(0.72 0.15 40)',
      size: 'large',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security for your data',
      color: 'oklch(0.60 0.16 165)',
    },
  ];

  return (
    <section id="features" className="py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="eyebrow mb-4">FEATURES</p>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Everything You Need to Manage SOW
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built by agencies, for agencies. Every feature is designed to make your workflow smoother.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`glass p-8 group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden ${
                feature.size === 'large' ? 'md:col-span-2' : ''
              }`}
            >
              {/* Gradient background on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <AnimatedGradient 
                  colors={[feature.color, 'transparent']}
                  speed={0.02}
                  blur="heavy"
                />
              </div>
              
              <div className="relative z-10">
                <div className="empty-art mb-6 w-16 h-16">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Product showcase section with screenshots
function ProductShowcaseSection() {
  const [activeTab, setActiveTab] = useState(0);
  
  const screenshots = [
    {
      id: 'dashboard',
      title: 'Intuitive Dashboard',
      description: 'Get a bird\'s eye view of all your projects, tasks, and team performance in one beautiful interface.',
      image: '/dashboard-screenshot.png',
      placeholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2940 1770"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23785cef;stop-opacity:0.1" /%3E%3Cstop offset="100%25" style="stop-color:%239b8aff;stop-opacity:0.1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23g)" width="2940" height="1770"/%3E%3Cg fill="%23fff" opacity="0.1"%3E%3Crect x="200" y="200" width="600" height="400" rx="20"/%3E%3Crect x="200" y="650" width="600" height="200" rx="20"/%3E%3Crect x="200" y="900" width="600" height="200" rx="20"/%3E%3Crect x="850" y="200" width="1890" height="900" rx="20"/%3E%3C/g%3E%3C/svg%3E',
      features: ['Real-time updates', 'Task overview', 'Team activity tracking'],
      gradient: ['oklch(0.52 0.17 300)', 'oklch(0.60 0.12 268)'],
    },
    {
      id: 'brands',
      title: 'Brand Management',
      description: 'Organize all your clients with custom workspaces, each with their own branding and team members.',
      image: '/brands-screenshot.png',
      placeholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2940 1764"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%239b8aff;stop-opacity:0.1" /%3E%3Cstop offset="100%25" style="stop-color:%23ff99cc;stop-opacity:0.1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23g)" width="2940" height="1764"/%3E%3Cg fill="%23fff" opacity="0.1"%3E%3Crect x="200" y="200" width="400" height="300" rx="20"/%3E%3Crect x="650" y="200" width="400" height="300" rx="20"/%3E%3Crect x="1100" y="200" width="400" height="300" rx="20"/%3E%3Crect x="200" y="550" width="400" height="300" rx="20"/%3E%3Crect x="650" y="550" width="400" height="300" rx="20"/%3E%3Crect x="1100" y="550" width="400" height="300" rx="20"/%3E%3C/g%3E%3C/svg%3E',
      features: ['Custom branding', 'Team assignment', 'SOW tracking'],
      gradient: ['oklch(0.60 0.12 268)', 'oklch(0.68 0.15 355)'],
    },
    {
      id: 'analytics',
      title: 'Powerful Analytics',
      description: 'Track revenue, monitor delivery metrics, and get insights that help you make better decisions.',
      image: '/analytics-screenshot.png',
      placeholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2940 1766"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23ff99cc;stop-opacity:0.1" /%3E%3Cstop offset="100%25" style="stop-color:%23ffb366;stop-opacity:0.1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23g)" width="2940" height="1766"/%3E%3Cg fill="%23fff" opacity="0.1"%3E%3Ccircle cx="700" cy="500" r="300"/%3E%3Crect x="1200" y="200" width="1540" height="400" rx="20"/%3E%3Crect x="200" y="900" width="800" height="300" rx="20"/%3E%3Crect x="1200" y="900" width="800" height="300" rx="20"/%3E%3C/g%3E%3C/svg%3E',
      features: ['Revenue tracking', 'Performance metrics', 'Custom reports'],
      gradient: ['oklch(0.68 0.15 355)', 'oklch(0.72 0.15 40)'],
    },
  ];

  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-30">
        <AnimatedGradient 
          colors={screenshots[activeTab].gradient}
          speed={0.01}
          blur="heavy"
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="eyebrow mb-4">PRODUCT SHOWCASE</p>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            See Howl in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the most beautiful workflow management system designed specifically for creative agencies.
          </p>
        </motion.div>

        {/* Tab navigation */}
        <div className="flex justify-center mb-12">
          <div className="glass-thin p-1 rounded-2xl flex gap-1">
            {screenshots.map((screenshot, index) => (
              <button
                key={screenshot.id}
                onClick={() => setActiveTab(index)}
                className={cn(
                  'px-6 py-3 rounded-xl font-medium transition-all duration-300',
                  activeTab === index
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {screenshot.title}
              </button>
            ))}
          </div>
        </div>

        {/* Screenshot display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            {/* Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-2 lg:order-1"
            >
              <h3 className="text-3xl font-semibold mb-4">
                {screenshots[activeTab].title}
              </h3>
              <p className="text-lg text-muted-foreground mb-8">
                {screenshots[activeTab].description}
              </p>
              
              <ul className="space-y-4 mb-8">
                {screenshots[activeTab].features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} className="text-primary" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <Link href="/login" className="btn-primary gloss inline-flex items-center gap-2 group">
                Try it Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Screenshot */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="order-1 lg:order-2"
            >
              <div className="relative group">
                {/* Browser window frame */}
                <div className="glass-thick rounded-2xl p-3 shadow-2xl">
                  {/* Browser header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-destructive/80"></div>
                      <div className="w-3 h-3 rounded-full bg-warning/80"></div>
                      <div className="w-3 h-3 rounded-full bg-success/80"></div>
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="glass-thin px-3 py-1 rounded-lg text-xs text-muted-foreground">
                        app.howl.com/{screenshots[activeTab].id}
                      </div>
                    </div>
                  </div>
                  
                  {/* Screenshot image */}
                  <div className="relative overflow-hidden rounded-lg bg-muted aspect-video">
                    <img
                      src={screenshots[activeTab].image}
                      alt={screenshots[activeTab].title}
                      className="w-full h-full object-cover"
                      loading="eager"
                      onError={(e) => {
                        console.error('Image failed to load:', screenshots[activeTab].image);
                        e.target.src = screenshots[activeTab].placeholder;
                      }}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%]">
                  <AnimatedGradient 
                    colors={[...screenshots[activeTab].gradient, 'transparent']}
                    speed={0.02}
                    blur="heavy"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Screenshot thumbnails */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex justify-center gap-4"
        >
          {screenshots.map((screenshot, index) => (
            <button
              key={screenshot.id}
              onClick={() => setActiveTab(index)}
              className={cn(
                'relative w-32 h-20 rounded-lg overflow-hidden transition-all duration-300 group',
                activeTab === index
                  ? 'ring-2 ring-primary scale-105'
                  : 'opacity-60 hover:opacity-100'
              )}
            >
              <img 
                src={screenshot.image} 
                alt={screenshot.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-background/10 group-hover:bg-background/0 transition-all" />
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// How it works section
function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Create Your Brands',
      description: 'Set up workspaces for each client with custom branding',
      icon: Layers,
    },
    {
      number: '02',
      title: 'Define Scope of Work',
      description: 'Input monthly deliverables and budget allocations',
      icon: CheckCircle2,
    },
    {
      number: '03',
      title: 'Assign & Track Tasks',
      description: 'Distribute work to team members and monitor progress',
      icon: Users,
    },
    {
      number: '04',
      title: 'Analyze Performance',
      description: 'Get real-time insights on delivery and revenue',
      icon: TrendingUp,
    },
  ];

  return (
    <section id="how-it-works" className="py-32 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="eyebrow mb-4">HOW IT WORKS</p>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Simple Yet Powerful Workflow
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-[60%] w-full h-0.5 bg-linear-to-r from-primary/50 to-transparent" />
              )}
              
              <div className="inline-flex items-center justify-center w-40 h-40 rounded-full glass mb-6 relative overflow-hidden group">
                <AnimatedGradient 
                  colors={['oklch(0.52 0.17 300 / 0.2)', 'transparent']}
                  speed={0.01}
                  blur="medium"
                />
                <div className="relative z-10">
                  <span className="text-5xl font-bold text-primary/20">{step.number}</span>
                  <step.icon size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pricing section
function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: 49,
      description: 'Perfect for small agencies',
      features: [
        'Up to 5 brands',
        'Unlimited tasks',
        '3 team members',
        'Basic analytics',
        'Email support',
      ],
    },
    {
      name: 'Professional',
      price: 149,
      description: 'For growing agencies',
      features: [
        'Up to 20 brands',
        'Unlimited tasks',
        '15 team members',
        'Advanced analytics',
        'Priority support',
        'API access',
        'Custom branding',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large agencies',
      features: [
        'Unlimited brands',
        'Unlimited tasks',
        'Unlimited team members',
        'Custom analytics',
        'Dedicated support',
        'API access',
        'White labeling',
        'Custom integrations',
      ],
    },
  ];

  return (
    <section id="pricing" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="eyebrow mb-4">PRICING</p>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground">
            Start with a 14-day free trial. No credit card required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`glass p-8 relative ${
                plan.popular ? 'ring-2 ring-primary' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>
              <p className="text-muted-foreground mb-6">{plan.description}</p>
              
              <div className="mb-6">
                {typeof plan.price === 'number' ? (
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground ml-2">/month</span>
                  </div>
                ) : (
                  <span className="text-4xl font-bold">{plan.price}</span>
                )}
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-primary shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                href="/login"
                className={`w-full justify-center ${
                  plan.popular ? 'btn-primary gloss' : 'btn-ghost'
                }`}
              >
                Get Started
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA section
function CTASection() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0">
        <AnimatedGradient 
          colors={[
            'oklch(0.52 0.17 300 / 0.3)',
            'oklch(0.60 0.12 268 / 0.3)',
            'oklch(0.68 0.15 355 / 0.3)'
          ]}
          speed={0.01}
          blur="heavy"
        />
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 glass-title">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join hundreds of agencies already using Howl to deliver projects on time and exceed client expectations.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="btn-primary gloss text-lg px-8 py-4 group">
              Start Your Free Trial
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="btn-ghost text-lg px-8 py-4">
              Schedule a Demo
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="glass-thin py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <Logo variant="full" size={32} className="mb-4" />
            <p className="text-sm text-muted-foreground max-w-sm">
              The most beautiful workflow management system for creative agencies. 
              Track SOW, manage tasks, and deliver excellence.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a></li>
              <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Updates</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#about" className="text-sm text-muted-foreground hover:text-foreground">About</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Howl. All rights reserved.
          </p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-foreground">
              <Globe size={20} />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              <Palette size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main landing page
export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (session?.user) {
      router.push('/dashboard');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Aurora background */}
      <div className="aurora-bg" />
      
      <Navigation />
      <HeroSection />
      <ProductShowcaseSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
