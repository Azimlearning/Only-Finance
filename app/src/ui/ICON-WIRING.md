# Icon and logo wiring (not yet applied)

New files: `src/ui/icons.tsx` (`Icon`, `ICONS`, `IconName`), `src/ui/Logo.tsx` (`Logo`, `LogoMark`), and `public/` assets.
Note: `src/ui/Icon.tsx` (older, another agent) still exists; migrate its usages to `icons.tsx`, then delete it.
Usage: `import { Icon } from './icons'` then `<Icon name="explain" size={16} />`. Decorative by default; pass `label` only when the icon is the sole content of a control (then prefer `aria-label` on the button and leave the icon decorative).
Sizes: 16 inline with text, 18 tabs/buttons, 20 section headings, 14 inside chips/tooltips. Never add emoji.

## Where each icon goes
| File / element | Replace | With |
|---|---|---|
| `Header.tsx` brand block | text/emoji logo | `<Logo variant="full" size={28} />` (hide wordmark under 400px: `<Logo variant="mark">` instead) |
| `Header.tsx` tour/guided button | emoji or text | `compass` = `tour` |
| `Header.tsx` theme toggle (next agent) | n/a | `themeLight` / `themeDark` / `themeSystem` (show icon of the active mode) |
| `Header.tsx` Tutor button, `TutorDrawer.tsx` title | any sparkle/emoji | `tutor` |
| `App.tsx` / tab bar (`Sidebar.tsx` or tab list) | tab labels | budget=`budget`, parity=`parity`, scenarios=`scenarios`, hedging=`hedging`, arbitrage=`arbitrage`, verify=`verify`, practice=`practice` |
| `Explain.tsx` button | 💡 | `explain` (size 16) |
| Every close button (`TutorDrawer.tsx`, `Tour.tsx`, toasts, `Term.tsx` popover) | ✕ | `close` (size 16-18), keep `aria-label="Close"` |
| `Term.tsx` tooltip trigger | any "?" or "i" glyph | `info` (size 14) |
| `ScenarioSelect.tsx` trigger and options | none | `scenario`; `chevron` on the trigger; importer rows `importer`, exporter rows `exporter` |
| `Sidebar.tsx` section headings | text only | "Deal" `invoice`, "Interest rates" `interestRate`, "Inflation" `inflation`, "Exchange rate" `exchangeRate`, "Hedge and bank terms" `hedging`, "Assumptions" `assumptions`; day/tenor fields `days` |
| `Sidebar.tsx` "ILLUSTRATIVE" badge | n/a | `warning` (size 14) |
| `VerifyTab.tsx` and AI number-guard chips | check mark text | `verified` (emerald, with the word "Verified"); corrected values use `warning` (amber, with the word "Corrected") |
| AI offline fallback notice | n/a | `offline` |
| `TutorDrawer.tsx` send button | arrow text | `send`; restart/new chat `restart` |
| `Tour.tsx` Back / Next | text arrows | `back` / `next` after/before the label |
| `Workings.tsx` toggle | text | `workings` + `chevron` (rotate 180deg when open) |
| External links | arrow glyph | `external` (size 14) |

## `app/index.html` `<head>` (replace the existing icon/theme-color lines)
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#f4f7fa" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
<meta property="og:type" content="website" />
<meta property="og:title" content="OnlyFinance" />
<meta property="og:description" content="Only the finance you need before you pay in dollars." />
<meta property="og:image" content="/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
```
`icon-192.png` / `icon-512.png` are for a future web manifest only.

## Dark mode
`Logo` reads `--logo-accent` (default `#0f766e`). In the dark theme CSS set `--logo-accent: #2dd4bf;`. Arc one and the ledger rule use `currentColor`, so put the logo in a text-colour container.
