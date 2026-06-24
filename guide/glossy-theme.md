# Aurora Glass — Glossy / Liquid-Glass Theme & Design System Guide

> A complete, reproducible spec for a **glossy, translucent, liquid-glass** visual language — the opposite of the matte-editorial AssetMind system. Use it to re-skin the app or generate new glass surfaces in the same style. Modeled on Apple's *Liquid Glass* (WWDC 2025 / iOS 26) and the 2026 **dark-glassmorphism** trend.

**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 (CSS-first `@theme`) · `next-themes` (class strategy) · fonts via `next/font/google`. Drop-in compatible with the existing token plumbing in `src/app/globals.css`.

**Design tone in one line:** *Frosted glass floating over a living aurora* — vivid gradient-mesh backdrops, translucent blurred panels with a bright specular rim, depth through layered light, and motion that makes light slide across surfaces. Dark-first, neon-adjacent, premium and alive.

---

## 0. Why this differs from AssetMind (the "older" feel)

| AssetMind (matte editorial) | Aurora Glass (glossy) |
|---|---|
| Flat warm-neutral surfaces, color rationed | Vivid gradient-mesh backdrop is the *star* |
| Depth via lightness ladder + hairlines | Depth via **translucency + blur + specular rim + shadow** |
| Italic serif, quiet | Big geometric/expressive display type |
| No shadows at rest | Layered shadows + inner light glow always |
| Opaque cards | Translucent glass that reveals the backdrop |
| Quiet micro-motion | Light **sheen sweeps**, tilt, depth parallax |

The single biggest lever: **glass only reads against a rich, colorful backdrop.** Solid flat backgrounds kill it. So this system pairs every glass surface with an aurora gradient mesh behind the whole app.

---

## 1. Design Principles

1. **The backdrop is the hero.** A multi-stop gradient mesh (or subtly animated aurora) sits behind everything. Glass borrows its color by blurring it. No vivid backdrop → no glass.
2. **Ration the glass (≤3 glass tiers visible per view).** Overusing `backdrop-filter` looks cheap and kills scroll performance. Glass goes on *floating* things — nav/toolbar, cards, modals, popovers. Dense content areas stay near-solid.
3. **Every glass edge has a specular rim.** A ~1px near-white inset highlight on the top/left mimics light catching real glass. This is the detail that separates "transparent box" from "glass."
4. **Depth = blur + saturate + layered shadow + inner glow.** `backdrop-filter: blur() saturate()` frosts the backdrop; an inset white top-highlight + hairline rim + soft outer drop-shadow build the 3D read. In dark mode add an *inner light-emitting stroke* so glass stays visible.
5. **Light moves.** Hover/active states slide a **sheen** across the surface, tilt toward the cursor, or deepen the blur. Motion is the "liquid" in liquid glass — but transform/opacity/filter only.
6. **Glossy ≠ illegible.** Text sits on a tint dense enough for ≥4.5:1 contrast; never put body copy directly on raw glass over a busy area. Honor `prefers-reduced-transparency` and `prefers-reduced-motion` with solid fallbacks.
7. **Token-driven.** Components consume semantic tokens (`bg-glass`, `border-glass-rim`, `shadow-glass`). New theme = new token values + new backdrop; components never change.

---

## 2. Architecture — How Theming Is Wired

```
src/app/
├── layout.js        → load fonts → CSS variables (--font-display, --font-sans, --font-mono, …)
├── globals.css      → @theme inline (token→utility map) + :root (light) + .dark (dark)
│                      + .aurora-bg backdrop + .glass tiers + gloss/sheen + motion
└── components/
    ├── providers/ThemeProvider.jsx   → next-themes (class strategy, defaultTheme="dark")
    └── shared/AuroraBackdrop.jsx      → fixed gradient-mesh layer behind the app
```

**Flow:** fonts → CSS vars on `<html>` → `@theme inline {}` maps raw vars to Tailwind utilities → `:root`/`.dark` define values → `next-themes` toggles `.dark`. To re-theme: edit token values + swap the aurora gradient. Nothing else.

> **Dark-first.** Glassmorphism peaks in dark mode (the headline 2026 look). Set `defaultTheme="dark"`. Light mode is supported but secondary.

---

## 3. Color System

### 3.1 Format

OKLCH with an **alpha channel** for all glass fills: `oklch(L C H / A)`. Alpha is what makes it glass. Backdrops are vivid (high chroma); glass tints are low-alpha neutrals or accent-tinted.

### 3.2 The Aurora Backdrop (the differentiator)

A fixed, full-viewport gradient mesh built from 3–4 radial blobs of accent hues over a deep base. Dark theme:

```css
.aurora-bg {
  position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(45% 55% at 18% 22%, oklch(0.62 0.20 285 / 0.55), transparent 70%),  /* violet */
    radial-gradient(40% 50% at 82% 18%, oklch(0.68 0.18 230 / 0.45), transparent 70%),  /* azure  */
    radial-gradient(55% 60% at 75% 85%, oklch(0.66 0.19 165 / 0.40), transparent 70%),  /* teal   */
    radial-gradient(50% 55% at 25% 90%, oklch(0.64 0.22 330 / 0.38), transparent 70%),  /* magenta*/
    oklch(0.16 0.03 275);                                                                /* deep base */
}
.aurora-bg.is-animated { animation: aurora-drift 24s var(--ease-glass) infinite alternate; }
@keyframes aurora-drift {
  0%   { filter: hue-rotate(0deg)   saturate(1);   transform: scale(1); }
  100% { filter: hue-rotate(20deg)  saturate(1.15); transform: scale(1.08); }
}
```

Light theme uses pastel blobs over a near-white base:

```css
.light .aurora-bg {
  background:
    radial-gradient(45% 55% at 18% 22%, oklch(0.85 0.10 285 / 0.65), transparent 70%),
    radial-gradient(40% 50% at 82% 18%, oklch(0.88 0.09 230 / 0.60), transparent 70%),
    radial-gradient(55% 60% at 75% 85%, oklch(0.88 0.10 165 / 0.55), transparent 70%),
    oklch(0.97 0.01 275);
}
```

### 3.3 Semantic Tokens

Every glass surface is **fill + rim + glow + shadow**, not just a background.

| Token | Role |
|---|---|
| `--bg-base` | Deep canvas behind the aurora (rarely seen) |
| `--glass-thin` / `--glass` / `--glass-thick` | Three blur/alpha tiers (see §5) |
| `--glass-rim` | Specular edge highlight (near-white, low alpha) |
| `--glass-glow` | Inner light-emitting stroke for dark mode |
| `--foreground` / `--muted-foreground` | Text on glass |
| `--primary` … `--primary-foreground` | Accent (vivid, glossy) — CTAs, focus, active |
| `--accent-2`, `--accent-3` | Secondary glossy accents for gradients/charts |
| `--success` / `--warning` / `--destructive` | Status (kept saturated for glass) |
| `--ring` | Focus ring (mirrors primary, glows) |
| `--shadow-glass` | Layered outer shadow |
| `chart-1…5` | Vivid data-viz series |

### 3.4 Canonical Token Values

#### `.dark` — "Midnight Aurora" (primary)
```css
.dark {
  --bg-base: oklch(0.16 0.03 275);
  --foreground: oklch(0.97 0.01 280);
  --muted-foreground: oklch(0.74 0.03 280);

  /* glass fills (note the alpha) */
  --glass-thin:  oklch(0.80 0.04 280 / 0.06);
  --glass:       oklch(0.80 0.04 280 / 0.10);
  --glass-thick: oklch(0.82 0.05 280 / 0.16);
  --glass-rim:   oklch(1 0 0 / 0.55);            /* top specular highlight */
  --glass-glow:  oklch(0.75 0.18 285 / 0.35);    /* inner light stroke */

  --primary: oklch(0.70 0.19 285);               /* electric violet */
  --primary-foreground: oklch(0.16 0.03 285);
  --accent-2: oklch(0.72 0.16 230);              /* azure */
  --accent-3: oklch(0.74 0.18 165);              /* teal */

  --success: oklch(0.74 0.18 160);
  --warning: oklch(0.80 0.16 85);
  --destructive: oklch(0.66 0.22 20);
  --ring: oklch(0.70 0.19 285);

  --chart-1: oklch(0.70 0.19 285);
  --chart-2: oklch(0.72 0.16 230);
  --chart-3: oklch(0.74 0.18 165);
  --chart-4: oklch(0.80 0.16 85);
  --chart-5: oklch(0.70 0.20 330);

  --radius: 1rem;                                /* glass likes bigger radii */
  --shadow-glass:
    0 8px 32px oklch(0 0 0 / 0.45),
    0 2px 8px oklch(0 0 0 / 0.30);
}
```

#### `:root` / `.light` — "Daybreak Glass"
```css
:root, .light {
  --bg-base: oklch(0.97 0.01 275);
  --foreground: oklch(0.22 0.03 280);
  --muted-foreground: oklch(0.45 0.03 280);

  --glass-thin:  oklch(1 0 0 / 0.35);
  --glass:       oklch(1 0 0 / 0.55);
  --glass-thick: oklch(1 0 0 / 0.70);
  --glass-rim:   oklch(1 0 0 / 0.85);
  --glass-glow:  oklch(0.70 0.16 285 / 0.18);

  --primary: oklch(0.58 0.20 285);
  --primary-foreground: oklch(0.99 0.01 285);
  --accent-2: oklch(0.60 0.17 230);
  --accent-3: oklch(0.62 0.18 165);

  --success: oklch(0.62 0.17 160);
  --warning: oklch(0.70 0.15 85);
  --destructive: oklch(0.58 0.22 20);
  --ring: oklch(0.58 0.20 285);

  --radius: 1rem;
  --shadow-glass:
    0 8px 32px oklch(0.50 0.05 280 / 0.18),
    0 2px 8px oklch(0.50 0.05 280 / 0.10);
}
```

### 3.5 `@theme inline` mapping (excerpt)
```css
@theme inline {
  --color-glass-thin: var(--glass-thin);
  --color-glass: var(--glass);
  --color-glass-thick: var(--glass-thick);
  --color-glass-rim: var(--glass-rim);
  --color-foreground: var(--foreground);
  --color-muted-foreground: var(--muted-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent-2: var(--accent-2);
  --color-accent-3: var(--accent-3);
  --color-ring: var(--ring);
  /* …chart, status, radii, fonts… */
}
```

---

## 4. Typography — a large, role-mapped font library

Glossy systems pair an **expressive display** face with a **clean geometric body** face. Below is a deep bench (all on `next/font/google` unless noted) — pick ONE per role per theme. Mixing too many on one screen is noise; the library exists so you can re-skin fast.

### 4.1 Display / Hero (pick one)
| Font | Character | Vibe |
|---|---|---|
| **Sora** | geometric, slightly techy | clean modern SaaS |
| **Space Grotesk** | quirky-geometric | crypto / product |
| **Bricolage Grotesque** | warm, editorial-grotesque | premium, distinctive |
| **Unbounded** | rounded, heavy, expressive | bold, playful glass |
| **Syne** | weird-elegant, wide | fashion / creative |
| **Clash Display** (Fontshare) | high-impact display | hero headlines |
| **Fraunces** | high-contrast soft serif | luxe, editorial glass |
| **Gloock** | high-contrast display serif | dramatic |

### 4.2 Body / UI sans (pick one)
| Font | Character |
|---|---|
| **Inter** | the safe, hyper-legible default |
| **Geist** | crisp, modern, Vercel-y |
| **Plus Jakarta Sans** | friendly geometric |
| **Onest** | neutral, contemporary |
| **Figtree** | rounded, approachable |
| **Manrope** | tight, semi-rounded |
| **DM Sans** | clean low-contrast grotesque |
| **Schibsted Grotesk** | editorial-leaning UI |

### 4.3 Mono / Data (pick one)
| Font | Character |
|---|---|
| **Geist Mono** | matches Geist |
| **JetBrains Mono** | developer classic |
| **Space Mono** | retro-techy |
| **IBM Plex Mono** | corporate-clean |

### 4.4 Recommended pairings (curated)
1. **Product-modern:** Sora (display) + Inter (body) + Geist Mono. *Safe, crisp.*
2. **Premium-distinctive (default for this theme):** Bricolage Grotesque (display) + Geist (body) + JetBrains Mono.
3. **Bold-expressive:** Unbounded (display) + Plus Jakarta Sans (body) + Space Mono.
4. **Luxe-editorial glass:** Fraunces (display) + Onest (body) + IBM Plex Mono.
5. **Creative:** Syne (display) + Figtree (body) + Geist Mono.

### 4.5 Loading & variables (`layout.js`)
```js
import { Bricolage_Grotesque, Geist, JetBrains_Mono } from 'next/font/google'
const display = Bricolage_Grotesque({ variable: '--font-display', subsets: ['latin'], weight: ['400','600','700','800'] })
const sans    = Geist({ variable: '--font-sans', subsets: ['latin'] })
const mono    = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'] })
// <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
```
```css
@theme inline {
  --font-display: var(--font-display), ui-sans-serif, system-ui, sans-serif;
  --font-sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-mono), ui-monospace, monospace;
}
```

### 4.6 Type voice
Display headings are **large and confident** (weight 600–800), tracking slightly negative. On glass, add a faint text glow for legibility:
```css
.glass-title { font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em;
  text-shadow: 0 1px 12px oklch(0 0 0 / 0.25); }
```
Scale: eyebrow 11px · caption 12px · body 14px · lede 16px · h2 clamp(1.5–2rem) · h1 clamp(2.25–3.25rem).

---

## 5. The Glass Recipes (core of the system)

### 5.1 Three tiers — choose by elevation
```css
/* shared base */
.glass, .glass-thin, .glass-thick {
  position: relative;
  border-radius: var(--radius);
  border: 1px solid var(--glass-rim);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
          backdrop-filter: blur(16px) saturate(180%);
  box-shadow:
    inset 0 1px 1px var(--glass-rim),            /* top specular highlight */
    inset 0 -1px 1px oklch(1 0 0 / 0.08),         /* faint bottom bounce */
    0 0 0 1px oklch(0 0 0 / 0.04),                /* hairline rim */
    var(--shadow-glass);                          /* soft outer depth */
  isolation: isolate;                             /* contain blends */
}
.glass-thin  { background: var(--glass-thin);  backdrop-filter: blur(10px) saturate(160%); }
.glass       { background: var(--glass); }
.glass-thick { background: var(--glass-thick); backdrop-filter: blur(28px) saturate(200%); }

/* dark-mode inner glow so glass stays visible in low light */
.dark .glass, .dark .glass-thick {
  box-shadow:
    inset 0 1px 1px var(--glass-rim),
    inset 0 0 20px var(--glass-glow),
    0 0 0 1px oklch(1 0 0 / 0.06),
    var(--shadow-glass);
}
```
- **`.glass-thin`** — nav bars, chips, secondary controls.
- **`.glass`** — cards, panels (the workhorse).
- **`.glass-thick`** — modals, popovers, anything that must obscure content behind it.

### 5.2 Gloss / sheen overlay (the "wet" look)
A top-down highlight gradient + a moving sheen on hover.
```css
.gloss::before {                 /* static top gloss */
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(180deg, oklch(1 0 0 / 0.18), transparent 40%);
}
.gloss::after {                  /* sheen sweep, slides on hover */
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(105deg, transparent 30%, oklch(1 0 0 / 0.25) 48%, transparent 60%);
  transform: translateX(-120%); transition: transform 0.7s var(--ease-glass);
}
.gloss:hover::after { transform: translateX(120%); }
```

### 5.3 Gradient rim (richer than a flat border)
```css
.glass-grad-rim {
  border: 1px solid transparent;
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(135deg, oklch(1 0 0 / 0.6), transparent 40%, oklch(1 0 0 / 0.2)) border-box;
}
```

### 5.4 Liquid-glass refraction (advanced, opt-in)
True Apple-style edge refraction = `backdrop-filter` + an SVG displacement filter. Heavy; use only on a hero element and gate behind capability/motion checks.
```html
<svg width="0" height="0" style="position:absolute">
  <filter id="liquid-glass" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise"/>
    <feGaussianBlur in="noise" stdDeviation="1" result="soft"/>
    <feDisplacementMap in="SourceGraphic" in2="soft" scale="40"
        xChannelSelector="R" yChannelSelector="G" result="warp"/>
    <feSpecularLighting in="soft" surfaceScale="3" specularConstant="0.8"
        specularExponent="20" lighting-color="#ffffff" result="spec">
      <fePointLight x="-50" y="-100" z="200"/>
    </feSpecularLighting>
    <feComposite in="spec" in2="warp" operator="in" result="specMasked"/>
    <feBlend in="warp" in2="specMasked" mode="screen"/>
  </filter>
</svg>
```
```css
.liquid-glass { backdrop-filter: url(#liquid-glass) blur(12px) saturate(160%) brightness(1.1); }
```
> Perf: each element size ideally needs its own map; `scale` controls distortion. Provide a `.glass` fallback when `@supports not (backdrop-filter: url(#x))` or reduced-transparency is set.

---

## 6. Radius, Spacing & Shape

Glass reads best **rounded**. Base `--radius: 1rem` (16px); ramp:
```css
--radius-sm: 0.625rem; --radius-md: 0.8rem; --radius-lg: 1rem;
--radius-xl: 1.4rem; --radius-2xl: 2rem; --radius-pill: 999px;
```
Cards `rounded-2xl`, buttons `rounded-xl` or pill, chips pill. Generous padding (cards `p-6`), 8px rhythm. Glass needs air around it to float.

---

## 7. Motion System

**Easings:** signature `--ease-glass: cubic-bezier(0.22, 1, 0.36, 1)` (liquid settle); press `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight overshoot).

**Durations:** micro 0.15–0.2s · hover/sheen 0.6–0.7s · entrance 0.5s · aurora drift 24s.

| Pattern | Effect |
|---|---|
| `.gloss:hover::after` | sheen sweeps across the surface |
| `.glass-tilt` | subtle 3D tilt toward cursor (JS-driven `rotateX/Y`, ≤6°) |
| press | `scale(0.98)` + deepen blur briefly |
| entrance | fade + `translateY(10px)` + slight blur-in |
| `.aurora-bg.is-animated` | slow hue-rotate + scale drift behind glass |
| focus | ring **glows** (`box-shadow` ring + soft outer bloom) |

Animate transform / opacity / filter only. All gated by `prefers-reduced-motion`.

---

## 8. Component Conventions

- **Button (primary):** glossy filled — `background: linear-gradient(180deg, color-mix(in oklab,var(--primary) 100%, white 12%), var(--primary))`, `.gloss` overlay, pill radius, glow shadow `0 4px 16px color-mix(in oklab,var(--primary) 50%, transparent)`. Active = `scale(0.98)`.
- **Button (glass/secondary):** `.glass-thin .gloss`, text `--foreground`.
- **Card / panel:** `.glass .gloss` with `--shadow-glass`; hover lifts + sheen.
- **Nav / toolbar:** floating `.glass-thin` bar, detached from edges with margin, pill or `rounded-2xl`.
- **Modal:** `.glass-thick .gloss` over a dimmed + blurred scrim (`backdrop-filter: blur(8px); background: oklch(0 0 0 / 0.4)`).
- **Input:** translucent `background: oklch(1 0 0 / 0.06)`, `--glass-rim` border, focus = glowing ring + brighter fill.
- **Chip / badge:** `.glass-thin` pill; accent variants tint the fill with `color-mix(... var(--accent) 18%, transparent)`.

> Convention: components consume tokens (`bg-glass`, `border-glass-rim`, `text-foreground`), add `.gloss` for sheen, express state with `data-*`, and reach for `color-mix` for tints. Never hardcode hex.

---

## 9. Accessibility & Performance (non-negotiable)

**A11y:**
- Body text needs ≥4.5:1 — sit it on `--glass-thick` or add a text-shadow/scrim; never raw thin glass over a busy backdrop.
- Honor reduced transparency:
```css
@media (prefers-reduced-transparency: reduce) {
  .glass, .glass-thin, .glass-thick { backdrop-filter: none;
    background: color-mix(in oklab, var(--bg-base) 92%, var(--foreground) 4%); }
}
```
- Honor `prefers-reduced-motion` (stop aurora drift, sheen, tilt).

**Perf:**
- ≤3 distinct `backdrop-filter` surfaces per viewport. Heavy blur + many layers = jank + battery drain.
- Add `isolation: isolate` and avoid animating `backdrop-filter` itself. Use `will-change: transform` on tilt elements only.
- The aurora backdrop is one fixed element, not per-card.
- `@supports (backdrop-filter: blur(1px))` fallback to solid tinted surfaces.

---

## 10. How To Generate a New Glossy Theme (Recipe)

1. **Pick a base depth + 2–3 accent hues** for the aurora (analogous or triadic; keep chroma high).
2. **Build the aurora backdrop** (§3.2) — base + radial blobs in the accent hues.
3. **Set glass tier alphas:** thin 0.06 / regular 0.10 / thick 0.16 (dark); 0.35 / 0.55 / 0.70 (light). Rim near-white.
4. **Set the accent + glow** (`--primary`, `--glass-glow`) from one aurora hue; brighten primary in dark mode.
5. **Pick fonts** (§4) — one display + one body + one mono.
6. **Keep glass recipes, gloss, motion, radii untouched** — that's the identity.
7. **Verify contrast** on glass; test reduced-transparency + reduced-motion fallbacks; test scroll perf with 3 glass layers.
8. **Test both themes + the backdrop behind real content** (busy areas must stay legible).

### 10.1 Drop-in skeleton
```css
.dark {
  --bg-base: oklch(0.16 0.03 H0);
  --glass-thin: oklch(0.80 0.04 H0 / 0.06);
  --glass: oklch(0.80 0.04 H0 / 0.10);
  --glass-thick: oklch(0.82 0.05 H0 / 0.16);
  --glass-rim: oklch(1 0 0 / 0.55);
  --glass-glow: oklch(0.75 0.18 H1 / 0.35);
  --primary: oklch(0.70 0.19 H1);
  --primary-foreground: oklch(0.16 0.03 H1);
  --accent-2: oklch(0.72 0.16 H2);
  --accent-3: oklch(0.74 0.18 H3);
  --radius: 1rem;
  --shadow-glass: 0 8px 32px oklch(0 0 0 / 0.45), 0 2px 8px oklch(0 0 0 / 0.30);
  /* + aurora-bg blobs in H1/H2/H3 */
}
```

---

## 11. Quick Reference — Do / Don't

| Do | Don't |
|---|---|
| Put glass over a vivid aurora backdrop | Put glass over a flat solid color (looks like a gray box) |
| Add a specular rim + inner glow to every glass surface | Use a plain 1px gray border |
| Limit to ≤3 glass tiers per view | Make the whole page glass (jank + cheap) |
| Use big radii + generous padding | Square, cramped glass |
| Slide light (sheen/tilt) on interaction | Animate `backdrop-filter` (expensive) |
| Provide solid fallbacks (reduced-transparency / `@supports`) | Trap text on thin glass over busy areas |
| Vivid saturated accents, dark-first | Muted desaturated palette (kills the glow) |

---

## 12. File Map

| Concern | File |
|---|---|
| Tokens + light/dark + glass/gloss/motion CSS | `src/app/globals.css` |
| Font loading | `src/app/layout.js` |
| Theme provider (dark default) | `src/components/providers/ThemeProvider.jsx` |
| Aurora backdrop layer | `src/components/shared/AuroraBackdrop.jsx` (new) |
| Tailwind/PostCSS | `postcss.config.mjs` (Tailwind v4 CSS-first) |

---

## Sources
- [Apple Liquid Glass (Wikipedia)](https://en.wikipedia.org/wiki/Liquid_Glass) · [Liquid Glass 2026 dev guide](https://medium.com/@expertappdevs/liquid-glass-2026-apples-new-design-language-6a709e49ca8b)
- [Dark Glassmorphism — the 2026 aesthetic](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f) · [What Is Glassmorphism (IxDF)](https://ixdf.org/literature/topics/glassmorphism)
- [How to create Liquid Glass effects with CSS and SVG (LogRocket)](https://blog.logrocket.com/how-create-liquid-glass-effects-css-and-svg/) · [CSS Liquid Glass How-To (Mitkov)](https://www.mitkov-systems.de/en/blog/css-liquid-glass-how-to)
- [70+ CSS Glassmorphism Examples](https://freefrontend.com/css-glassmorphism/) · [10+ CSS Liquid Glass snippets](https://freefrontend.com/css-liquid-glass/)
- [Glassmorphism done right (Clay)](https://clay.global/blog/glassmorphism-ui)

*Living spec. To extend: edit `:root`/`.dark` + the `.aurora-bg` gradient in `globals.css`, fonts in `layout.js`, `--radius` for shape. Everything else inherits.*
