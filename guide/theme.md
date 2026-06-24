# AssetMind — Theming & Design System Guide

> A complete, reproducible specification of the AssetMind visual language: color, type, surfaces, motion, and component conventions. Use this as a prompt/spec to generate new themes or new surfaces in the **same** style — or hand it to another designer/LLM to extend the system without breaking it.

**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 (CSS-first `@theme`) · shadcn + Base UI primitives · `next-themes` (class strategy) · fonts via `next/font/google`.

**Design tone in one line:** *New Yorker masthead meets product-page restraint* — premium editorial, warm-neutral surfaces, a single sage-green accent, italic serif headings, hairline rules, and cinematic micro-motion. The UI is deliberately quiet so visual assets are the star.

---

## 1. Design Principles

These are the rules that make a new theme "feel AssetMind." Honor them first; pick colors second.

1. **Surfaces recede, content leads.** Backgrounds are near-neutral and low-chroma. Never let a surface compete with imagery. Color is rationed.
2. **One accent, used sparingly.** A single sage-green primary carries brand. No rainbow badges, no multi-hue UI. Tints (`color-mix`) over solid fills.
3. **Editorial typography.** Italic serif (`Instrument Serif`) for display/headings; clean grotesque sans (`DM Sans`) for body; mono (`JetBrains Mono`) for code/data. Small-caps eyebrows, wide tracking, hairline dividers.
4. **Layered depth via lightness, not borders.** Surface hierarchy is built by stepping OKLCH lightness (`sidebar < background < muted < card`), reinforced by a faint global noise texture — not heavy shadows or thick strokes.
5. **Perceptual color (OKLCH only).** Every color is `oklch(L C H)`. This keeps light/dark conversions and tint math perceptually even. No hex, no HSL, no RGB in tokens.
6. **Motion is cinematic but cheap.** Custom cubic-bezier easings (`cubic-bezier(0.16, 1, 0.3, 1)`), short durations, transform/opacity only. Hover = lift + reveal. Theme switch = expanding circle from the toggle.
7. **Token-driven, never hardcoded.** Components consume semantic tokens (`bg-card`, `text-muted-foreground`, `border-border`). A new theme is just a new set of `:root` / `.dark` variable values — components never change.

---

## 2. Architecture — How Theming Is Wired

```
frontend/src/app/
├── layout.tsx        → loads 3 Google fonts → CSS variables (--font-sans, --font-geist-mono, --font-display)
├── globals.css       → @theme inline (token→utility map) + :root (light) + .dark (dark) + component CSS
└── components/
    ├── providers.tsx     → next-themes <ThemeProvider> (class strategy)
    └── theme-toggle.tsx   → View Transitions API expanding-circle swap
```

**Flow:**
1. `layout.tsx` injects font CSS variables onto `<html>`.
2. `globals.css` `@theme inline {}` maps raw CSS vars → Tailwind utility tokens (so `--color-primary` becomes `bg-primary`, `text-primary`, etc.).
3. `:root` defines the **light** theme values; `.dark` overrides them.
4. `next-themes` toggles the `.dark` class on `<html>`; `@custom-variant dark (&:is(.dark *))` makes Tailwind's `dark:` modifier follow that class.

To create a new theme you **only** edit the variable values in `:root` / `.dark` (or add a new `.theme-x` class). Nothing else.

---

## 3. Color System

### 3.1 Format & Convention

All tokens are **OKLCH**: `oklch(L C H)` where `L` = lightness `0–1`, `C` = chroma `0–~0.4`, `H` = hue `0–360`.

- **Warm neutrals** sit at hue `~75` with tiny chroma (`0.012–0.02`) → "warm stone."
- **Dark-mode neutrals** shift to a cool charcoal hue `~250` (slate) for a premium, non-muddy black.
- **Brand accent (sage green)** lives at hue `~155`.
- Foreground/text keeps the warm `75` hue even in dark mode → avoids a cold, clinical feel.

### 3.2 Semantic Tokens (the full set)

Every token comes as a `{token}` + `{token}-foreground` pair (background + the text/icon color that sits on it).

| Token | Role |
|---|---|
| `background` / `foreground` | Page canvas + default text |
| `card` / `card-foreground` | Elevated surfaces (cards, panels) |
| `popover` / `popover-foreground` | Floating surfaces (menus, tooltips) |
| `primary` / `primary-foreground` | Brand accent — CTAs, active states, focus ring |
| `secondary` / `secondary-foreground` | Subtle/secondary buttons |
| `muted` / `muted-foreground` | Recessed surfaces + de-emphasized text |
| `accent` / `accent-foreground` | Hover highlight surface |
| `destructive` | Errors, delete actions (red, hue ~25) |
| `border` | Dividers, outlines |
| `input` | Form field background |
| `ring` | Focus ring (mirrors primary) |
| `chart-1…5` | Data-viz series (sage → teal → orange → indigo → magenta) |
| `sidebar*` | Full parallel set for the sidebar (deepest layer) |

### 3.3 Surface Hierarchy (the depth ladder)

Depth is encoded purely in **lightness**. Memorize the ladder — it's what makes the UI read as layered.

**Light theme ("Warm Stone")** — lighter = closer to viewer:
```
sidebar      0.84   recessed nav
background   0.88   page canvas
muted        0.83   disabled/recessed
secondary    0.84   subtle buttons
input        0.86   form fields
card/popover 0.92   elevated surfaces ← lightest
border       0.78   visible dividers
```

**Dark theme ("Charcoal Slate")** — darker = deepest:
```
sidebar      0.13   deepest layer ← darkest
background   0.16   page canvas
muted        0.19   recessed
secondary    0.21   subtle buttons
input        0.22   form fields
accent       0.22   hover highlight
card/popover 0.20   elevated surfaces
border       0.28   visible dividers
```

> **Rule:** In light mode elevated surfaces get *lighter*; in dark mode the sidebar gets *darker* than the canvas. Both create the same "recessed nav, floating card" read.

### 3.4 Canonical Token Values

#### `:root` — Light ("Warm Stone")
```css
:root {
  --background: oklch(0.88 0.015 75);
  --foreground: oklch(0.18 0.015 75);
  --card: oklch(0.92 0.012 75);
  --card-foreground: oklch(0.18 0.015 75);
  --popover: oklch(0.92 0.012 75);
  --popover-foreground: oklch(0.18 0.015 75);
  --primary: oklch(0.42 0.10 155);          /* sage green */
  --primary-foreground: oklch(0.96 0.005 155);
  --secondary: oklch(0.84 0.014 75);
  --secondary-foreground: oklch(0.20 0.015 75);
  --muted: oklch(0.83 0.012 75);
  --muted-foreground: oklch(0.35 0.02 75);
  --accent: oklch(0.85 0.02 155);
  --accent-foreground: oklch(0.18 0.015 75);
  --destructive: oklch(0.48 0.20 25);
  --border: oklch(0.78 0.015 75);
  --input: oklch(0.86 0.012 75);
  --ring: oklch(0.42 0.10 155);
  --chart-1: oklch(0.42 0.10 155);   /* sage   */
  --chart-2: oklch(0.52 0.12 200);   /* teal   */
  --chart-3: oklch(0.48 0.12 28);    /* orange */
  --chart-4: oklch(0.56 0.10 265);   /* indigo */
  --chart-5: oklch(0.46 0.10 320);   /* magenta*/
  --radius: 0.625rem;
  --sidebar: oklch(0.84 0.016 75);
  --sidebar-foreground: oklch(0.18 0.015 75);
  --sidebar-primary: oklch(0.42 0.10 155);
  --sidebar-primary-foreground: oklch(0.96 0 0);
  --sidebar-accent: oklch(0.79 0.022 155);
  --sidebar-accent-foreground: oklch(0.18 0.015 75);
  --sidebar-border: oklch(0.76 0.015 75);
  --sidebar-ring: oklch(0.42 0.10 155);
}
```

#### `.dark` — Dark ("Charcoal Slate")
```css
.dark {
  --background: oklch(0.16 0.01 250);
  --foreground: oklch(0.92 0.01 75);
  --card: oklch(0.20 0.01 250);
  --card-foreground: oklch(0.92 0.01 75);
  --popover: oklch(0.20 0.01 250);
  --popover-foreground: oklch(0.92 0.01 75);
  --primary: oklch(0.68 0.10 155);          /* brighter sage for dark */
  --primary-foreground: oklch(0.12 0.02 155);
  --secondary: oklch(0.21 0.01 250);
  --secondary-foreground: oklch(0.88 0.01 75);
  --muted: oklch(0.19 0.01 250);
  --muted-foreground: oklch(0.58 0.015 75);
  --accent: oklch(0.22 0.015 155);
  --accent-foreground: oklch(0.92 0.01 75);
  --destructive: oklch(0.60 0.20 25);
  --border: oklch(0.28 0.01 250);
  --input: oklch(0.22 0.01 250);
  --ring: oklch(0.68 0.10 155);
  --chart-1: oklch(0.68 0.10 155);
  --chart-2: oklch(0.62 0.10 200);
  --chart-3: oklch(0.70 0.12 65);
  --chart-4: oklch(0.58 0.10 265);
  --chart-5: oklch(0.55 0.12 320);
  --sidebar: oklch(0.13 0.01 250);
  --sidebar-foreground: oklch(0.88 0.01 75);
  --sidebar-primary: oklch(0.68 0.10 155);
  --sidebar-primary-foreground: oklch(0.12 0 0);
  --sidebar-accent: oklch(0.19 0.015 155);
  --sidebar-accent-foreground: oklch(0.88 0.01 75);
  --sidebar-border: oklch(0.24 0.01 250);
  --sidebar-ring: oklch(0.68 0.10 155);
}
```

### 3.5 Tinting Rule — `color-mix`, not new tokens

Never invent a new token for "a lighter primary." Mix toward transparency or another token in OKLab:

```css
/* faint brand wash on a card */
background: color-mix(in oklab, var(--primary) 4%, var(--card));
/* sage-tinted hairline border */
border-color: color-mix(in oklab, var(--primary) 18%, transparent);
/* muted text pushed toward foreground */
color: color-mix(in oklab, var(--muted-foreground) 80%, var(--foreground));
```
Common mix percentages used across the app: **4–8%** (subtle fills/washes), **18–35%** (tinted borders), **70–80%** (text emphasis blends).

---

## 4. Typography

### 4.1 The Three Families

| Role | Family | Variable | Loaded as | Weights |
|---|---|---|---|---|
| Body / UI (sans) | **DM Sans** | `--font-sans` | `next/font/google` | 400, 500, 600, 700 |
| Display / Headings (serif) | **Instrument Serif** | `--font-display` → `--font-heading` | `next/font/google` | 400 (used italic) |
| Code / Data (mono) | **JetBrains Mono** | `--font-geist-mono` → `--font-mono` | `next/font/google` | default |

Loaded in `layout.tsx`, exposed as CSS variables on `<html>`, mapped in `@theme inline`:
```css
--font-sans: var(--font-sans);
--font-mono: var(--font-geist-mono);
--font-heading: var(--font-display, var(--font-sans));  /* graceful fallback */
```
Base: `html { @apply font-sans; }` with `antialiased`.

### 4.2 The Editorial Voice

Headings are **italic serif at weight 400** — never bold. This is the signature move. Tracking is slightly negative on large type, positive (wide) on small eyebrows.

```css
.editorial-h1 {
  font-family: var(--font-heading);
  font-style: italic; font-weight: 400;
  font-size: clamp(1.75rem, 2.4vw, 2.25rem);
  line-height: 1.05; letter-spacing: -0.015em;
}
.editorial-h2 { /* same recipe, 1.375rem, -0.01em */ }
.editorial-lede {            /* intro paragraph */
  font-size: 0.9375rem; line-height: 1.55; max-width: 60ch;
  color: color-mix(in oklab, var(--muted-foreground) 80%, var(--foreground));
}
.eyebrow {                   /* section kicker */
  font-size: 0.6875rem; font-weight: 500;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--muted-foreground);
}
```

### 4.3 Type Scale (rem)

| Use | Size |
|---|---|
| Eyebrow / micro-label | 0.6875rem (11px) |
| Caption / hint | 0.75rem (12px) |
| Body small / field label | 0.8125rem (13px) |
| Body / default | 0.875rem (14px) |
| Lede | 0.9375rem (15px) |
| H2 (editorial) | 1.375rem (22px) |
| H1 (editorial) | clamp 1.75–2.25rem |

> **Measure:** cap text columns at `56–60ch` (`.field-hint` 56ch, `.editorial-lede` 60ch).

---

## 5. Radius, Spacing & Shape

Single source radius `--radius: 0.625rem` (10px), scaled into a ramp in `@theme`:
```css
--radius-sm:  calc(var(--radius) * 0.6);   /* ~6px  */
--radius-md:  calc(var(--radius) * 0.8);   /* ~8px  */
--radius-lg:  var(--radius);               /* 10px  */
--radius-xl:  calc(var(--radius) * 1.4);   /* ~14px */
--radius-2xl: calc(var(--radius) * 1.8);
--radius-3xl: calc(var(--radius) * 2.2);
--radius-4xl: calc(var(--radius) * 2.6);
```
Buttons use `rounded-lg`; pills/chips use `999px`. To reshape the whole UI, change **one** number (`--radius`).

---

## 6. Motion System

**Easings:** signature ease-out is `cubic-bezier(0.16, 1, 0.3, 1)` (cinematic settle). Reveal/blur uses `cubic-bezier(0.22, 1, 0.36, 1)`. Breathing/pulse uses `cubic-bezier(0.45, 0, 0.55, 1)`.

**Durations:** micro 0.18–0.25s · hover 0.35–0.4s · entrance 0.45–0.5s · reveal 0.75s.

**Animate transform + opacity only** (never layout). Key patterns baked into `globals.css`:

| Class / keyframe | Effect |
|---|---|
| `.gallery-card` hover | `translateY(-4px) scale(1.015)` + layered shadow lift |
| `.gallery-overlay` | gradient caption slides up on card hover |
| `.gallery-enter` / `.editorial-rise` / `.brief-section` | staggered fade-up entrance |
| `.float-gentle` | 4s idle bob for empty-state art |
| `.dropzone-active` | pulsing sage ring on upload target |
| `.breathing-gradient` | radial sage gradient that breathes behind pending image tiles |
| `.reveal-image` | blur-up reveal as generated images load |
| `.shimmer` | skeleton loading sweep (token-aware light/dark) |
| `.score-bar` | sage→teal gradient indicator |

**Theme switch** is a View Transitions API expanding circle originating at the toggle button (`theme-toggle.tsx` sets `--theme-toggle-x/y`, `globals.css` animates `clip-path: circle()`):
```css
@keyframes theme-reveal {
  from { clip-path: circle(0% at var(--theme-toggle-x,50%) var(--theme-toggle-y,50%)); }
  to   { clip-path: circle(150% at var(--theme-toggle-x,50%) var(--theme-toggle-y,50%)); }
}
```

**Texture:** a fixed, `0.025` opacity SVG fractal-noise layer (`body::before`) sits behind everything to kill the flat-digital look. Keep it subtle.

---

## 7. Component Conventions

Components are **shadcn + Base UI** primitives styled purely through semantic tokens via `class-variance-authority` (`cva`) and the `cn()` helper (`clsx` + `tailwind-merge`). They never reference raw colors.

**Button variants** (`ui/button.tsx`): `default` (solid primary), `outline`, `secondary`, `ghost`, `destructive` (tinted, not solid red), `link`. Sizes `xs · sm · default · lg` + icon variants. Active state nudges `translate-y-px`. Focus = `ring-3 ring-ring/50`.

**Editorial UI patterns** (custom classes in `globals.css`, prefer these over default shadcn for the Concepts wizard / content surfaces):

- `.chip` — monochrome pill, hairline border, **no fill until active**. `data-tone="primary"` for sage tint, `data-active="true"` inverts to `foreground` bg. *Replaces rainbow `Badge`.*
- `.field-row` — a label + input + hint with a single bottom hairline. *Replaces the "boxed card per input" pattern.*
- `.chapter` — Roman-numeral + label nav step with animated active dot and `✓` completion glyph.
- `.territory-glyph` — single-char sage-ringed avatar.
- `.concept-card` — quiet resting state; action bar fades in on hover/focus; `data-selected` adds sage border + 4% wash.
- `.rule-hairline` / `.rule-vertical` — gradient dividers that fade at the ends.
- `.prose-normal` / `.prose-compact` — lightweight markdown typography scales for LLM output.

> **Convention:** new components consume tokens (`bg-card text-card-foreground border-border`), express interactive states with `data-*` attributes, and reach for `color-mix` for any tint. Don't add color tokens for one-offs.

---

## 8. How To Generate a New Theme (Recipe)

Use this as the prompt/checklist. Producing a new theme = producing a new `:root` + `.dark` block that obeys the ladder.

1. **Pick a neutral hue + a single accent hue.**
   - Light neutrals: warm (~75) or cool (~250); keep chroma `0.01–0.02`.
   - Accent: choose one hue; keep chroma `~0.10`. (Current: sage `155`.)
2. **Set the lightness ladder** (don't deviate from the ordering):
   - Light: `sidebar 0.84 < background 0.88 < muted 0.83* < card 0.92`; border `0.78`; foreground `0.18`.
   - Dark: `sidebar 0.13 < background 0.16 < card 0.20 < border 0.28`; foreground `0.92`.
3. **Derive every `{token}-foreground`** as near-white on dark surfaces / near-black on light surfaces, **keeping the warm-75 hue on text** for warmth.
4. **Accent goes brighter in dark mode** (`L 0.42 → 0.68`) so it stays legible on charcoal.
5. **Charts:** accent first, then walk hue around the wheel (`155 → 200 → 28/65 → 265 → 320`) at similar L/C.
6. **Keep `--radius`, fonts, motion, and component classes untouched** — that's what preserves the AssetMind identity across themes.
7. **Verify contrast:** body text ≥ 4.5:1, large/UI text ≥ 3:1. OKLCH lightness delta is a good proxy; confirm with a checker.
8. **Test both modes + the toggle transition**, and check the noise/texture layer still reads at `0.025`.

**Adding a *named* alt theme** (instead of overriding default): scope a class and point `next-themes` at it.
```css
.theme-midnight { /* same token names, new oklch values */ }
```
```tsx
<ThemeProvider attribute="class" themes={["light","dark","theme-midnight"]} />
```

### 8.1 Drop-in template
```css
:root {
  /* NEUTRAL_HUE = __  ACCENT_HUE = __ */
  --background: oklch(0.88 0.015 NEUTRAL_HUE);
  --foreground: oklch(0.18 0.015 NEUTRAL_HUE);
  --card: oklch(0.92 0.012 NEUTRAL_HUE);
  --primary: oklch(0.42 0.10 ACCENT_HUE);
  --primary-foreground: oklch(0.96 0.005 ACCENT_HUE);
  --muted: oklch(0.83 0.012 NEUTRAL_HUE);
  --muted-foreground: oklch(0.35 0.02 NEUTRAL_HUE);
  --border: oklch(0.78 0.015 NEUTRAL_HUE);
  --ring: oklch(0.42 0.10 ACCENT_HUE);
  --radius: 0.625rem;
  /* …complete the full token set from §3.4, holding the ladder… */
}
.dark { /* mirror with dark ladder from §3.4, accent L→0.68 */ }
```

---

## 9. Quick Reference — Do / Don't

| Do | Don't |
|---|---|
| Use semantic tokens (`bg-card`, `text-muted-foreground`) | Hardcode hex/rgb/hsl anywhere |
| Express tints with `color-mix(... in oklab)` | Add a new token for a one-off shade |
| Keep one accent hue; ration color | Introduce multi-hue/ rainbow UI |
| Italic serif 400 for headings | Bold sans headings |
| Animate transform/opacity, 0.16/1/0.3/1 ease | Animate layout/colors with linear ease |
| Build depth via lightness + noise | Reach for heavy drop-shadows/thick borders |
| Respect the surface lightness ladder | Make the sidebar lighter than cards (light mode) |

---

## 10. File Map

| Concern | File |
|---|---|
| Token map + light/dark values + component CSS | `frontend/src/app/globals.css` |
| Font loading | `frontend/src/app/layout.tsx` |
| Theme provider (next-themes) | `frontend/src/components/providers.tsx` |
| Theme toggle + view-transition | `frontend/src/components/theme-toggle.tsx` |
| Tailwind/PostCSS | `frontend/postcss.config.mjs` (Tailwind v4 is CSS-first; no JS config) |
| Primitives | `frontend/src/components/ui/*` |
| `cn()` helper | `frontend/src/lib/utils.ts` |

---

*Generated as a living spec. To extend: edit only `:root` / `.dark` in `globals.css` for color, `layout.tsx` for fonts, `--radius` for shape. Everything else inherits.*
