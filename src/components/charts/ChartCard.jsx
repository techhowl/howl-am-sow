'use client'

import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, LabelList,
} from 'recharts'
import { useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { SERIES, AXIS, GRID_STROKE } from '@/components/charts/ChartTheme'

/* ── glass tooltip — backdrop-blurred card, replaces Recharts' white default ── */
function GlassTooltip({ active, payload, label, valueSuffix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-thin" style={{ padding: '9px 11px', borderRadius: 12, minWidth: 120 }}>
      {label != null && <p className="text-[11px] text-muted-foreground mb-1.5">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full shrink-0"
            style={{ background: p.payload?.color || p.color || p.fill, boxShadow: `0 0 8px ${p.payload?.color || p.color || p.fill}` }}
          />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-semibold text-foreground tabular-nums">{p.value}{valueSuffix}</span>
        </div>
      ))}
    </div>
  )
}

function Shell({ title, eyebrow, children, className, height = 240, glow = true }) {
  return (
    <div className={cn('surface-card p-5', glow && 'chart-glow', className)}>
      {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
      {title ? <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3> : null}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/** Vertical fade gradient defs, one per series color. */
function GradientDefs({ id, colors, vertical = true }) {
  return (
    <defs>
      {colors.map((c, i) => (
        <linearGradient key={i} id={`${id}-${i}`} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
          <stop offset="0%" stopColor={c} stopOpacity={0.95} />
          <stop offset="100%" stopColor={c} stopOpacity={0.25} />
        </linearGradient>
      ))}
    </defs>
  )
}

/** bars: [{ key, name?, color? }]. */
export function BarChartCard({ data, xKey, bars, title, eyebrow, height, className, showValues, valueSuffix = '' }) {
  const reduce = useReducedMotion()
  const colors = bars.map((b, i) => b.color || SERIES[i % SERIES.length])
  return (
    <Shell title={title} eyebrow={eyebrow} height={height} className={className}>
      <BarChart data={data} margin={{ top: 14, right: 8, left: -14, bottom: 0 }}>
        <GradientDefs id="bargrad" colors={colors} />
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey={xKey} stroke={AXIS.stroke} tick={AXIS.tick} tickLine={false} axisLine={false} />
        <YAxis stroke={AXIS.stroke} tick={AXIS.tick} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<GlassTooltip valueSuffix={valueSuffix} />} cursor={{ fill: 'color-mix(in oklab, var(--foreground) 6%, transparent)', radius: 8 }} />
        {bars.map((b, i) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.name || b.key}
            fill={`url(#bargrad-${i})`}
            radius={[6, 6, 2, 2]}
            maxBarSize={46}
            isAnimationActive={!reduce}
            animationDuration={800}
          >
            {showValues ? (
              <LabelList dataKey={b.key} position="top" className="fill-muted-foreground" style={{ fontSize: 10, fontWeight: 600 }} formatter={(v) => `${v}${valueSuffix}`} />
            ) : null}
          </Bar>
        ))}
      </BarChart>
    </Shell>
  )
}

/** lines: [{ key, name?, color? }]. Renders glowing area-fill lines. */
export function AreaChartCard({ data, xKey, lines, title, eyebrow, height, className }) {
  const reduce = useReducedMotion()
  const colors = lines.map((l, i) => l.color || SERIES[i % SERIES.length])
  return (
    <Shell title={title} eyebrow={eyebrow} height={height} className={className}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
        <GradientDefs id="areagrad" colors={colors} />
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey={xKey} stroke={AXIS.stroke} tick={AXIS.tick} tickLine={false} axisLine={false} />
        <YAxis stroke={AXIS.stroke} tick={AXIS.tick} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<GlassTooltip />} />
        {lines.map((l, i) => (
          <Area
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name || l.key}
            stroke={colors[i]}
            strokeWidth={2.5}
            fill={`url(#areagrad-${i})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={!reduce}
            animationDuration={800}
          />
        ))}
      </AreaChart>
    </Shell>
  )
}

/** Kept for API compat — now a glowing area chart. */
export function LineChartCard(props) {
  return <AreaChartCard {...props} lines={props.lines} />
}

/** data: [{ name, value, color? }]. Glowing ring with rounded segments + center metric. */
export function DonutChartCard({ data, title, eyebrow, height = 240, className, centerLabel, centerSub }) {
  const reduce = useReducedMotion()
  return (
    <Shell title={title} eyebrow={eyebrow} height={height} className={className}>
      <PieChart>
        <defs>
          {data.map((d, i) => {
            const c = d.color || SERIES[i % SERIES.length]
            return (
              <linearGradient key={i} id={`slice-${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity={1} />
                <stop offset="100%" stopColor={c} stopOpacity={0.55} />
              </linearGradient>
            )
          })}
        </defs>
        <Tooltip content={<GlassTooltip />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="62%"
          outerRadius="86%"
          paddingAngle={3}
          cornerRadius={8}
          stroke="transparent"
          isAnimationActive={!reduce}
          animationDuration={800}
        >
          {data.map((d, i) => <Cell key={d.name} fill={`url(#slice-${i})`} />)}
        </Pie>
        {centerLabel != null && (
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
            <tspan x="50%" dy="-2" style={{ fill: 'var(--foreground)', fontSize: 26, fontWeight: 700 }}>{centerLabel}</tspan>
            {centerSub ? <tspan x="50%" dy="20" style={{ fill: 'var(--muted-foreground)', fontSize: 11 }}>{centerSub}</tspan> : null}
          </text>
        )}
      </PieChart>
    </Shell>
  )
}

/**
 * Single-metric glowing arc gauge (0–100). Drop into hero/stat surfaces.
 * `value` 0–100, `color` CSS var, `label`/`sub` for the center.
 */
export function RadialGauge({ value = 0, color = 'var(--primary)', size = 160, label, sub, className }) {
  const reduce = useReducedMotion()
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('relative chart-glow', className)} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={[{ name: 'v', value: v, fill: color }]}
          startAngle={90}
          endAngle={90 - (360 * v) / 100}
        >
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="value"
            cornerRadius={size}
            fill="url(#gaugeGrad)"
            background={{ fill: 'color-mix(in oklab, var(--foreground) 8%, transparent)' }}
            isAnimationActive={!reduce}
            animationDuration={900}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-display text-2xl font-bold text-foreground tabular-nums leading-none">{label ?? `${Math.round(v)}%`}</span>
        {sub ? <span className="eyebrow mt-1 text-[9px]">{sub}</span> : null}
      </div>
    </div>
  )
}
