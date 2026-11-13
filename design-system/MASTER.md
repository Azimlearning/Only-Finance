# OnlyFinance Design System (MASTER)

Source of truth for UI styling. Generated with ui-ux-pro-max (`--design-system -p "OnlyFinance"`; raw output kept in `design-system/onlyfinance/MASTER.md`), then adapted. Built on the earlier Emil Kowalski pass (easing tokens, press feedback, soft shadows, reduced motion); nothing there was undone.

## Product and style
Calm, trustworthy fintech/education dashboard for non-finance Malaysian SME owners. **Light theme by default, with a Dark and a System option** (see "Dark theme" below), soft layered shadows, generous whitespace, one teal brand colour. Reads on a projector and in A3 print. All rates are illustrative, and the labelling is deliberately quiet, with no badges: the footer line ("Educational tool. Illustrative rates, not market data. Not financial advice."), the same line in the tutor drawer, and one muted line under the sidebar "Your assumptions" heading. No amber chips, no caps.

## Palette (WCAG AA checked on white / slate-50)
| Role | Token | Hex | Contrast |
|---|---|---|---|
| Primary (buttons, links, active tab, forward/IRP series) | `teal-600` (overridden in `@theme`) | `#0f766e` | 5.5:1 |
| Accent figures, hover | `teal-700` (overridden) | `#115e59` | 7.6:1 |
| Gain / "you pay less" | `gain` | `#0f766e` | 5.5:1 |
| Loss / "costs you more" / warning | `loss` | `#b45309` | 5.0:1 |
| Verified (always a check mark plus the words "match the engine") | teal-700 / teal-800 text | `#115e59` / `#115e59` | 7.6:1 |
| Text | slate-900 / 700 / 600 | `#0f172a` / `#334155` / `#475569` | 17 / 10 / 7.6:1 |
| Page / card | | `#f4f7fa` / `#ffffff` | |
| Illustrative note | slate-600 text, no box | `#475569` | 7.6:1 |
| Warning / not all verified | amber-800 text | `#92400e` | 7.5:1 |
| Error | red-50 + red-800 | | |

Colour-blind safety: gain/loss are teal vs amber (blue-green vs orange), not red/green, and every amount also carries a +/- sign or an explicit word. Muted text never lighter than slate-600; hint text and placeholders use `fg-subtle` (`#5a6a7e`, 5.1:1 on the page background; the old slate-500 was 4.4:1 there, below AA).

The table above lists the light values; components no longer use palette classes (`slate-*`, `teal-*`, `bg-white`, hex). They use the semantic tokens in "Dark theme" below, whose light values are the ones listed here.

Chart roles (`CHART` in `app/src/ui/kit.tsx`, values are `var(--chart-*)` strings so Recharts follows the theme): colour is kept for meaning. Teal = forward / IRP and "better", amber = "costs you more" (gain/loss only). Everything else is neutral and told apart by weight and dash: option `#0f172a` 2px solid, money market `#64748b` 2px `7 4`, unhedged `#94a3b8` 2px `2 4`, PPP `#475569` dashed. Reference lines are all `#94a3b8` `4 4` with one shared slate label style, never a per-series colour. No blue or violet. The chart survives greyscale print and colour-blind viewing.

## Typography
IBM Plex Sans (400/500/600) for UI, IBM Plex Mono for workings. Nothing above 600: 600 is for card titles, figures and the primary button, 500 for labels and controls, 400 for body. Loaded from Google Fonts in `app/index.html`, with a Segoe UI/system fallback so the app still renders offline. Figures use `tabular-nums lining-nums` (`.num`, tables, inputs, chart text). Scale: page title 28, card title 20, lead figures up to 32, body 16/15, table 15, labels 13 (sentence case, medium, no tracking, class `.label`), helper text 12 minimum. No uppercase, no letter-spacing on small text.

## Layout
8px grid (4px steps inside controls). One row height per table: data tables `py-3`, the dense Verify table `py-2`. Sidebar 328px sticky, offsets from `--header-h` (set from the real header height, so they never break when the header wraps); content cards `p-6 sm:p-8`, 24px gap between cards, `max-w-[1800px]`. Every tab leads with its key number(s): Budget opens with three headline tiles (spot, IRP forward, stress) before the table; other cards lead with a `Stat`.

## Forms (sidebar)
Grouped under sub-heads (Interest rates, Inflation, Rate views, Hedge and bank terms). Label above, unit inside the field or right-aligned hint, one-line plain-English help for the non-obvious fields (`aria-describedby`). Inputs min 40px tall. Active preset shows its "what it demonstrates" note inline, not only as a tooltip.

## Interaction
Touch/click targets 40-46px on desktop; `cursor-pointer` on all buttons, tabs, summaries; one focus-visible ring (`--focus`); 150-240ms ease-out transitions; `prefers-reduced-motion` respected.

## Rejected from the generated recommendation
- **Dark Mode (OLED), gold/purple palette**: still rejected as the default look (the brief wants light, calm, trustworthy; the poster prints on white). A deep blue-slate dark theme with the same teal/amber logic is offered as an opt-in (2026-11-12, "Dark theme" below); light remains the default and the poster/print theme.
- **Conversion-optimised landing pattern**: this is a dashboard, not a landing page.
- **Glow effects / decorative gradients**: less restrained and worse in print (kept the earlier soft-shadow approach).
- IBM Plex Sans body-only pairing was extended with IBM Plex Mono for the workings blocks.

## Components (unslop pass, 2026-11-12)
- **Surfaces:** one level only. A card (`rounded-2xl`, 16) holds content separated by space and hairlines; nothing inside a card gets its own filled box or ring beyond tables (`rounded-lg`, 8). KPI figures use a 2px left rail (`border-gain` / `border-loss` / `border-teal-700` / `border-slate-300`), not a tile.
- **Radii:** controls 8, cards 16, pills 6 (`rounded-md`). No 14px.
- **Segmented control** (header scenario A/B, tone, sidebar toggles, tutor tone): `rounded-lg bg-slate-100 p-0.5`; active `bg-white text-slate-900` with the control shadow; inactive `text-slate-600`. Helpers `SEG_WRAP` / `segBtn` in `kit.tsx`. Solid teal is reserved for the single primary button ("Ask the tutor"), no teal-coloured shadows anywhere.
- **Logo:** flat mark, accent arc reads `--logo-accent` (`#0f766e` light, `#2dd4bf` dark), `rounded-lg`, no shadow. Header is the solid `surface` colour (no glass).
- **Inputs:** one `.field` shell in `index.css` (40px, control shadow, teal focus ring).
- **Icons:** `ui/Icon.tsx`, four inline 16px line icons (help, x, check, up/down), 1.5 stroke, `currentColor`. No emoji.
- **Signature, "checked by the engine":** `VerifiedMark` in `kit.tsx`, a small check plus "n/n numbers match the engine" in teal-800 text, no pill; amber text with a "?" icon when not all match. "Offline" is plain muted text after a dot.
- **Direction note:** "Higher MYR per USD means a weaker ringgit. All rates are MYR per 1 USD." shows once under the tab bar, not in every intro.
- **Accent budget:** primary button, active tab, selection, the one lead figure per card. Sub-heads, links and step numbers are slate.

## Dark theme (2026-11-12)
Light is the default. Header control "Light / Dark / System" (`ui/ThemeToggle.tsx`, radiogroup with roving tabindex, arrows/Home/End) persists to `localStorage` key `of_theme` (try/catch; no key or invalid value means Light). Mechanism: `<html class="dark">` plus `data-theme-pref`; an inline script in `app/index.html` sets both before first paint (no flash) and sets both `theme-color` metas and the `color-scheme` meta; `ui/theme.ts` is the store (`useSyncExternalStore`, follows `prefers-color-scheme` live while pref is System). Tailwind 4: `@custom-variant dark (&:where(.dark, .dark *));`, but components use semantic utilities (`bg-surface`, `text-fg-muted`, `border-line`, `bg-primary-tint`) mapped in `@theme inline` to CSS variables defined in `:root` (light) and `:root.dark` (inside `@media screen`, so print is always light). Theme switch cross-fades for 220ms through a temporary `data-theme-anim` attribute, never on first load and never under `prefers-reduced-motion`.

Rules: never use palette classes or hex in components, never `text-white` on a teal fill (use `text-on-primary`: white in light, `#042f2e` in dark), charts and SVG use `var(--...)`. Poster screenshots and video capture: set Light first.

| Token | Utility | Light | Dark |
|---|---|---|---|
| `--bg` | `bg-page` (body) | `#f4f7fa` | `#0f141a` |
| `--surface` | `bg-surface`, `.surface` | `#ffffff` | `#171e26` |
| `--surface-raised` | `bg-raised` (segment active, SVG card) | `#ffffff` | `#1e2731` |
| `--surface-overlay` | `.surface-overlay` (drawer, popovers, tour, chart tooltip) | `#ffffff` | `#263240` |
| `--surface-sunken` / `--surface-muted` | `bg-sunken` / `bg-muted` | `#f8fafc` / `#f1f5f9` | `#12181f` / `#222c37` |
| `--line`, `--line-soft`, `--line-strong` | `border-line*` | `#e2e8f0`, `#f1f5f9`, `#cbd5e1` | `#2a3541`, `#222b36`, `#66768a` |
| `--fg` / `--fg-2` | `text-fg` / `text-fg-2` | `#0f172a` / `#334155` | `#e8eef4` / `#cfd8e3` |
| `--fg-muted` / `--fg-subtle` | `text-fg-muted` / `text-fg-subtle` | `#475569` / `#5a6a7e` | `#a3b0bf` / `#8896a6` |
| `--primary`, `--primary-solid` | `text-primary`, `bg-primary-solid` | `#0f766e` | `#2dd4bf` |
| `--accent` (teal-700 role: accent figures, hover) | `text-accent`, `hover:bg-accent` | `#115e59` | `#5eead4` |
| `--on-primary` | `text-on-primary` | `#ffffff` | `#042f2e` |
| `--primary-tint`, `--primary-line` | `bg-primary-tint`, `ring-primary-line` | `#f0fdfa`, `#99f6e4` | `#12332f`, `#1f6b62` |
| `--gain` / `--cost` (`text-loss` alias) | `text-gain` / `text-cost` | `#0f766e` / `#b45309` | `#2dd4bf` / `#fbbf24` |
| `--cost-tint`, `--cost-text`, `--cost-line` | `bg-cost-tint`... | `#fffbeb`, `#92400e`, `#fde68a` | `#3a2a0c`, `#fcd34d`, `#6b4a0f` |
| `--danger`, `--danger-tint`, `--danger-line` | `text-danger`... | `#b91c1c`, `#fef2f2`, `#fecaca` | `#fb7185`, `#3b1219`, `#6b1f2c` |
| `--focus` (ring, glow `--shadow-focus`) | `outline-focus` | `#0f766e` | `#5eead4` |
| `--scrim`, `--scrim-soft` | `bg-scrim`, `bg-scrim-soft` | `rgb(15 23 42 / .55)`, `/ .2` | `rgb(0 0 0 / .62)`, `/ .45` |
| Tooltip `--tip-bg/fg/fg-2/title/line` (inverts against the theme) | `bg-tip-bg`... | `#0f172a` / `#e2e8f0` / `#94a3b8` / `#fff` | `#e2e8f0` / `#1e293b` / `#475569` / `#0f172a` |
| `--tour-ring` (spotlight) | `.tour-hole` | `#14b8a6` | `#5eead4` |
| `--chart-teal/amber/ink/slate/mute/ppp` | `CHART.*` | `#0f766e`, `#b45309`, `#0f172a`, `#64748b`, `#94a3b8`, `#475569` | `#2dd4bf`, `#fbbf24`, `#e8eef4`, `#94a3b8`, `#7a8a9e`, `#cbd5e1` |
| `--chart-grid/axis/zero/ref/cursor` | | `#e5eaf0`, `#cbd5e1`, `#64748b`, `#94a3b8`, `#f1f5f9` | `#2a3541`, `#3a4857`, `#8896a6`, `#66768a`, `rgb(255 255 255 / .05)` |

Elevation in dark is a lighter surface plus a 1px light hairline (shadows vanish on dark); `--shadow-control` becomes a `--line-strong` outline so input edges meet 3:1. Contrast (WCAG ratio): body `fg` 16.6:1 on the light page / 15.8:1 on the dark page; `fg-muted` 7.05:1 light page, 7.6:1 dark surface; `fg-subtle` 5.1:1 light page, 5.6:1 dark surface (4.7:1 on dark `surface-muted`); primary text 5.1:1 light page, 9.0:1 dark surface; cost 4.7:1 light page, 10.1:1 dark. Recharts legend words are set in `fg-2` (`legendText` in `kit.tsx`), never the series colour, so pale series like "Unhedged" still pass AA.
