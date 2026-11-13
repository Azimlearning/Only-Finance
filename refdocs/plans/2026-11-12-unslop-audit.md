# Unslop audit, 2026-11-12

Audit phase only (no code changed). Method: `.claude/skills/unslop` signs.md, tokens.md, visuals.md applied to all seven tabs, the tutor drawer, an Explain popover and the sidebar scrolled fully, at 1920x1080 on `localhost:5173`, plus a read of `app/src/ui/**`, `app/src/index.css`, `app/src/ai/components/**`. The tour, glossary tooltip and tone code was being edited during the audit, so it is only touched lightly.

Verdict: **light slop, polish mode.** The palette (one teal, one amber, tinted slate neutrals), IBM Plex and the Emil motion pass are real decisions. There are no gradients, blobs, glows on surfaces or hype copy. What is left is the 20% that makes it read as a template: uppercase tracked labels, four weights, an emoji, a "$" logo tile for a ringgit product, nested cards, equal card grids, a three-cool-hue chart palette, two duplicated badges and a few off-grid values.

Measured on `#budget` (live DOM): 9 font sizes, 4 weights (400/500/600/700), 18 uppercase tracked text nodes, radii 4/6/8/12/16/14, sidebar 1738px tall inside a 976px scroll box, presets at the very bottom of it.

---

## (a) Direction

- **Product.** A planner that shows a non-finance Malaysian SME owner (or student) how interest rates, inflation and the dollar rate change the ringgit amount on a USD invoice.
- **Character.** Calm, exact, plain-spoken. Reads like a well-set bank statement explained by a patient teacher.
- **World.** The ledger and the trade invoice: printed figures, hairline rules, "workings" shown line by line. Surfaces stay cool-neutral paper (current `#f4f7fa` / white); the world shows in the figures, not in the chrome.
- **Moments.** (1) The Budget KPI trio plus the teal/amber "difference vs spot" bars. (2) The parity triangle. (3) The hedge payoff chart. Everything else stays quiet.
- **Signature.** One quiet "checked by the engine" mark (small check, mono, text only) beside any figure the engine verified, replacing the three hand-built emerald pills. It is the one thing only this product has.

Keep: teal `#0f766e` as the single accent, amber `#b45309` for "costs you more", IBM Plex Sans/Mono, light theme.

---

## (b) Fix list

Order follows the skill: spacing, color, icons, copy, type, layout, details, visuals, motion. Paths are under `app/src/`. "Screen" says where you can see it.

### P1 must

**P1-1. Uppercase tracked labels (18 nodes).** Skill: Type, signs.md "Type".
- Where: `ui/kit.tsx` Stat label (line 54); `<thead>` in `tabs/BudgetTab.tsx:59`, `ScenariosTab.tsx:80`, `VerifyTab.tsx:61`; `ui/Sidebar.tsx` Section h3 (127); `ScenariosTab.tsx` 56 and 62; `ParityTab.tsx` 223 and 233; `ui/Header.tsx` "Scenario" label (52); `ui/Tour.tsx:41`; `ui/Term.tsx:227` (10px, "PLAIN WORDS"). Screens: all.
- Fix: replace `text-[13px] font-semibold uppercase tracking-wider text-slate-600` with `text-[13px] font-medium text-slate-600` (sentence case, tracking 0). Tooltip eyebrow: `text-xs font-medium text-slate-400`, text "Plain words" / "Textbook" (also fixes the 10px text, below the 12px minimum in MASTER). Add `.label` to `index.css` `@layer components` so it is one class.

**P1-2. Four font weights; 700 used for logo, badge, SVG, verify marks.** Skill: Type.
- Where: `Header.tsx:36` logo `font-bold`, `:45` and `Sidebar.tsx:152` badges `font-bold`; `ParityTab.tsx` SVG `fontWeight={700}` (lines 48, 62); `VerifyTab.tsx:79` `font-bold`; `KpiTile`/`Stat` `font-semibold` is fine.
- Fix: nothing above 600. Logo `font-semibold`; badges `font-semibold`; SVG node titles `fontWeight={600}`, edge names `500`. Weight set becomes 400/500/600 (600 only for card titles and figures, which is the poster-legibility choice).

**P1-3. Duplicated "illustrative" badge, one with a coloured glow.** Skill: Color, signs "Glowing pills", Components.
- Where: `Header.tsx:43-48` (amber chip with `shadow-[0_0_0_1.5px_#d97706]`, uppercase) and `Sidebar.tsx:150-155` (second full-width amber chip with `shadow-[...0_4px_12px_-4px_rgb(217_119_6/0.35)]`, a coloured shadow). Screens: every tab.
- Fix: keep both placements (MASTER requires header + sidebar) but make them one quiet component.
  - Header: `rounded-md bg-amber-50 px-2.5 py-1 text-[13px] font-semibold text-amber-900 ring-1 ring-amber-300`, text "Illustrative — not market rates". No uppercase, no `bold`, no outer 1.5px ring.
  - Sidebar (keep `data-testid="illustrative-badge"`): drop to a note inside the first card: `text-xs text-amber-900` with a 6px amber dot, no fill, no shadow, same words. Check `verify.test.ts` and any e2e for the literal "ILLUSTRATIVE" before changing case (grep found it in TutorDrawer, Header, Sidebar only).

**P1-4. "$" logo tile for a ringgit product; teal-coloured shadow on tile and buttons.** Skill: Details "logo", signs "Logo as a tile", Color "coloured shadows".
- Where: `Header.tsx:34` (`shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_2px_6px_-1px_rgb(15_118_110/0.45)]`), primary buttons `Header.tsx:86,108`, `ui/Tour.tsx:74`.
- Fix: flat mark that says what the product is about: `grid h-8 w-8 place-items-center rounded-lg bg-teal-700 text-[13px] font-semibold text-white` containing "RM" (not "$"). Remove every `rgb(15_118_110/…)` shadow; primary button becomes `bg-teal-600 text-white hover:bg-teal-700` with no inset highlight (light theme uses neutral soft shadow only, tokens.md Depth). Header `bg-white/85 backdrop-blur-md` becomes `bg-white` (no glass).

**P1-5. Header controls compete: two different segmented styles, solid teal on a non-primary control.** Skill: Color "one accent, used rarely", Details "active state".
- Where: `Header.tsx:55-70` (A/B: white chip, teal text) vs `:73-93` (SME owner/Student: solid teal fill) next to the real primary "Ask the AI tutor" (solid teal). Three teal-filled things in one bar. `SegButton` in Sidebar and the tutor drawer toggle use a third style.
- Fix: one `Segmented` look everywhere: container `rounded-lg bg-slate-100 p-0.5`, active `bg-white text-slate-900 shadow-[var(--shadow-control)]`, inactive `text-slate-600 hover:text-slate-900`. Solid teal is only the "Ask the tutor" button. Use identical order and labels in the drawer (SME owner first, as in the header).

**P1-6. Emoji and glyph icons.** Skill: Icons, checklist "No emoji left".
- Where: `ai/components/ExplainButton.tsx:71` `💡`; drawer close `TutorDrawer.tsx:138` `✕`; Practice `↑ Goes up` / `↓ Goes down` (`PracticeTab.tsx:82`).
- Fix: no icon package is installed (`lucide-react` absent from `package.json`). Add `ui/Icon.tsx` with 4 inline SVGs (help-circle, x, check, arrow-up/down), 16px, `stroke="currentColor" strokeWidth="1.5" fill="none"`, colour `text-slate-500`. Explain button: `[help icon] Explain`, text `text-slate-700`. Or ask the user before adding `lucide-react`.

**P1-7. Inconsistent row heights in the same table; off-grid padding.** Skill: Spacing.
- Where: `BudgetTab.tsx:61-79` rows use `py-2.5`, but the last cell uses `py-3` (`:79`). `py-2.5` (10px) appears in all table cells; `py-3.5` KpiTile (kit 77), `space-y-3.5` Sidebar Section (128), `px-3.5` Workings/chat, `mt-1.5`, `gap-1.5`, `-m-1 p-1` on the sidebar aside.
- Fix: one row height. Data tables `py-3` (Budget, Scenarios compare), dense Verify table `py-2`. KpiTile `py-4`. Section stack `space-y-4`. `px-3.5` becomes `px-4`. `mt-1.5` becomes `mt-2`. Pill `rounded-[14px]` becomes `rounded-md`.

**P1-8. Misleading semantics: amber/red styling on zero; wrong sentence at 0% spread.** Skill: Color "semantic colors only carry meaning", Copy.
- Where: `BudgetTab.tsx:143` `tone="bad"` on "Extra ringgit you pay" shows RM 0.00 in amber; `copy.ts` `budgetSpreadSub` says "you buy dollars dearer than today's price" at 0.00%. Screen: Budget, default preset.
- Fix: `tone={spreadRes.value.extraMYR > 0 ? 'bad' : 'default'}`; copy: when `s.a.spread === 0` use "The bank spread is 0.00%, so you trade at today's price. Raise it in the sidebar to see what the bank's margin costs." Display only; the engine value is untouched.

**P1-9. Hedge chart: three cool hues, indistinguishable in print.** Skill: Details "one accent per chart", Color.
- Where: `ui/kit.tsx` `CHART` (teal `#0f766e`, blue `#1d4ed8`, violet `#7c3aed`, slate) used in `HedgingTab.tsx:72-78`, `ScenariosTab.tsx:174-175,213-214`. Forward and Option are both thick blue-green lines; three reference labels in three colours collide at the top of the plot.
- Fix: forward = teal 3px solid (lead). Option = `#0f172a` 2px solid. Money market = `#64748b` 2px `7 4` dash. Unhedged = `#94a3b8` 2px `2 4`. Reference lines all `#94a3b8` `4 4`, labels `fill:#475569 fontSize:12 fontWeight:500` (no per-series colour). Remove `blue`/`violet` from `CHART`; sensitivity: PPP line `#475569` dashed; tornado: forward teal, PPP `#94a3b8`. Update the "Chart roles" paragraph in `design-system/MASTER.md`. Keeps the dash patterns (greyscale-print rule).

**P1-10. Explain popover is a wall of text; guarded numbers lose their spaces.** Skill: Layout, Type, Details.
- Where: `ExplainButton.tsx:78` (`w-[26rem]`, 14px, `leading-relaxed`, no height cap) and `GuardedText.tsx` (renders `- ` bullets as raw dashes via `whitespace-pre-wrap`). In the live screenshot "cost of450 000", "about6 459", "(4.4354" are visible: spacing before a number segment is eaten, so check `ai/guard.ts` segmentation and add `{' '}` handling. Screen: Budget, first Explain. It also covers the KPI tiles.
- Fix: popover `w-[28rem] max-h-[min(70vh,34rem)] overflow-y-auto p-5 text-[15px] leading-6`; split text on blank lines into `<p className="mt-2 first:mt-0">`, lines starting with `- ` into `<ul className="mt-2 list-disc space-y-1 pl-5">`. Verified underline `decoration-teal-600/60` (one hue, not emerald). Footer: single "checked" line (see P2-1).

### P2 should

**P2-1. Three hand-built verified pills (emerald, `rounded-full`, filled).** Signs "Glowing pills for counts"; Direction signature.
- Where: `ExplainButton.tsx:90-101`, `TutorDrawer.tsx:20-32`, `PracticeTab.tsx:173-180` and the Score pill `:66`, outcome pill `:143`.
- Fix: one `VerifiedMark` in `ui/kit.tsx`: `inline-flex items-center gap-1 text-xs font-medium text-teal-800` + check icon + "11/11 numbers match the engine" (amber text + "?" icon when not all). No fill, no pill. "Offline" becomes `text-xs text-slate-500` text after a dot. Score: `text-sm text-slate-600 num` "Score 0 of 0". Outcome: `rounded-md` not `rounded-full`.

**P2-2. Card-in-card nesting everywhere.** Skill: Details nested radius, Layout.
- Where: Card (`surface rounded-2xl p-8`) holds KpiTile (`bg-slate-50 ring-1 rounded-xl` + rail) (kit 77); table wrapper (`ring-1 rounded-xl`); limitations tiles (`BudgetTab.tsx:151`, 8 ringed tiles); identity boxes (`ParityTab.tsx:222,232`); verdict box (`:251`); arbitrage summary box (`ArbitrageTab.tsx:109`); Workings box; scenario slot tiles (`ScenariosTab.tsx:55`).
- Fix: strip the second surface, use space and hairlines.
  - KpiTile: `border-l-2 pl-4 py-1` (rail colour kept via `border-gain/-loss/-teal-700/-slate-300`), no bg/ring/overflow-hidden/absolute span.
  - Limitations: `<ul className="grid gap-x-12 gap-y-6 md:grid-cols-2">`, each `li` no bg/ring, title `text-sm font-medium text-slate-900`, body `text-sm text-slate-600`.
  - Identity: remove bg/ring on both boxes; `border-t border-slate-200 pt-4`; keep the 40px figures.
  - Nested radius: anything still inside a `p-8` card uses `rounded-lg` (8), never `rounded-xl`.

**P2-3. Equal card grids read as a template.** Skill: Details "vary the sizes".
- Where: Parity 2x2 (four identical stat-pair cards, `ParityTab.tsx:138`); Hedging 3 equal cards (`HedgingTab.tsx:91`); Limitations 8 equal tiles.
- Fix: Parity row 1 `xl:grid-cols-[3fr_2fr]` (IRP forward is the lead, figure at `text-[2rem]`), row 2 `xl:grid-cols-[2fr_3fr]` with the real-rates and IFE cards using `Stat size="sm"`. Hedging: give the three cards a shared header row and align their figures on one baseline (`grid-rows-subgrid` or `min-h`), or (P3) merge into one comparison table. Limitations: see P2-2.

**P2-4. Accent overuse.** Skill: Color "one accent, used rarely".
- Where: teal is used for logo, tab, tone toggle, Explain text, SubHead headings (`Sidebar.tsx:135` teal-700 x4), Workings summary, preset border, KPI rails, accent figures, arbitrage step circles (`ArbitrageTab.tsx:134` five solid teal discs), triangle boxes + edges + chips.
- Fix: accent = primary button, active tab, selection, and the one lead figure per card. SubHead `text-slate-600 font-medium`; Explain `text-slate-700`; Workings summary `text-slate-700 hover:text-slate-900`; arbitrage steps `h-6 w-6 rounded-full border border-slate-300 text-[13px] font-medium text-slate-600`, no fill; triangle: nodes `stroke="#cbd5e1" strokeWidth={1.5}`, edges `stroke="#94a3b8" strokeWidth={2}`, chips `fill="#f8fafc" stroke="#e2e8f0"`, chip title `fill="#475569"`, and only the Forward figure `fill="#115e59"`. Figures unchanged.

**P2-5. Sidebar: presets buried, 1738px tall, uneven labels.** Skill: Spacing "navigation is the densest part", Layout.
- Where: `Sidebar.tsx` Presets Section is last (needs a full scroll). "Option strike" / "Option premium" wrap to two lines beside a "MYR/USD" hint while other hints read "MYR per USD" (`:207-208`); inputs sit lower than siblings.
- Fix: move Presets above "Your deal" and render as a 2-col grid of `min-h-9 rounded-lg text-[13px]` buttons; retitle "Start from an example". Keep the inline note (`data-testid="preset-note"`). Option fields: labels "Strike" / "Premium" under SubHead "Option", hint "MYR per USD" everywhere. Section title "Your deal (slot A)" becomes "Your deal · Scenario A" (the app says "slot" in the sidebar and "Scenario" in the header). Widths: keep 328, it fits two-up inputs.

**P2-6. Practice tab layout and duplicate headings.** Skill: Layout, Copy.
- Where: `PracticeTabPanel.tsx` h2 "Practice" then `PracticeTab.tsx:63` second h2 "Quick question"; column `max-w-3xl` leaves 55% of a 1920 screen empty; the prompt is one 5-line paragraph.
- Fix: drop the inner h2, show "Question {attempted+1}" at `text-[13px] font-medium text-slate-600` plus Score at the right. Prompt: split into three short rows (Starting point / What changes / Your call) with `num` figures; `grid lg:grid-cols-[minmax(0,40rem)_1fr]` and put the result card in the right column so feedback sits beside the question, not below.

**P2-7. Verify tab: 87 identical rows; duplicate "all pass" messages.** Skill: Details stat cards, Components.
- Where: `VerifyTab.tsx:50-58` card title "87/87 match..." plus pill "All checks pass" (same message twice); 87 rows each with an 18px bold green tick.
- Fix: replace card title with `Stat`-style `87/87` (`text-[2rem] font-semibold num`) and caption "match the lecturer's workbook and Week 10 guide"; render the pill only when something fails (`Pill tone="red"`). Tick `text-base font-medium text-teal-700`, row `py-2`, `hover:bg-slate-50`; source column groups: show the source only on the first row of a run (`row.c.source !== prev`) so the table stops repeating "Workbook W5 CIA" 40 times.

**P2-8. Scenarios intro tip pill; slot tiles repeat the header.** Skill: Components "pills", Copy.
- Where: `ScenariosTab.tsx:227-229` teal Pill "Tip: edit slot A, switch to B, load another preset" floats between title and card.
- Fix: delete the Pill, put the sentence in the intro (copy section). Slot tiles (`:55`): drop the extra heading line "Scenario A" (name suffices with a `A`/`B` mono badge).

**P2-9. Tutor drawer.** Skill: Details, Layout, Copy.
- Where: `TutorDrawer.tsx:119` scrim `backdrop-blur-[2px]` (blurs the whole app behind it); tone control duplicates the header and flips order (Student first, `:148-150`); empty state is a 600px blank column; ✕ glyph; own `focus:ring-2` duplicates the global focus ring.
- Fix: scrim `bg-slate-900/20` and no blur; same Segmented as header, SME owner first; suggested questions as a vertical list (`divide-y divide-slate-100`, each `py-3 text-sm text-slate-800 hover:text-teal-800`) under a one-line intro, so the empty state looks intentional; X icon from P1-6; delete the `focus:ring-*` classes that duplicate `index.css` `:focus-visible`.

**P2-10. Bar chart carries no values; first bar dominates.** Skill: Details "charts".
- Where: `BudgetTab.tsx:117`.
- Fix: add `<LabelList dataKey="vsSpot" position="top" formatter={(v:number)=>fmtSignedMYR(v)} style={{fontSize:13, fill:'#334155'}} className="num" />` so the poster reads without the axis; `maxBarSize={72}`; remove the redundant parenthesis in the caption (legend already says it, see copy). Keep teal/amber fills and `isAnimationActive={false}`.

**P2-11. Dotted-underline on every glossary label.** Skill: Details (noise), Type.
- Where: `Term.tsx:249` plus ~40 `Term`s per screen (every table row, stat label, sidebar field). Light audit only: it is mid-edit.
- Fix: `decoration-slate-300` (not 400) and `decoration-[0.5px]`; `hover:decoration-teal-600` stays. Keep `tabIndex={0}` and the tooltip behaviour.

### P3 nice

- **P3-1. Colour-token drift.** Verified uses emerald-700 while gain is teal `#0f766e`: two near-identical greens. Use teal-700 for verified (check + word stays) and update MASTER.md. Pill/offline/rose/emerald tones in `Pill` reduce to slate/teal/amber/red.
- **P3-2. Two input styles.** Sidebar `NumField` (`control` ring), Arbitrage `NumInput` (`border-slate-300`, `ring-teal-100`), Scenarios `<select>` (`border-slate-300`), Practice input (`control`). One `.field` class in `index.css`: `control rounded-lg bg-white px-3 py-2 min-h-10 focus-within:shadow-[0_0_0_1px_#0f766e,0_0_0_4px_rgb(15_118_110/0.15)]`.
- **P3-3. Table row states.** Add `hover:bg-slate-50`; mark the "Spot today" row with `font-medium` and a 1px top rule rather than `bg-slate-50/60` (invisible on the screenshot).
- **P3-4. Nested radii pass.** Table wrappers and tiles inside cards `rounded-lg`; buttons 8; cards 16; `Pill` 6. Removes the odd 14px.
- **P3-5. Sticky offsets are magic numbers.** `App.tsx:20` `top-[5.5rem]` and `max-h-[calc(100vh-6.5rem)]` break when the header wraps below ~1500px. Measure with a CSS variable `--header-h` set on `Header`.
- **P3-6. Hedging cards as one table.** Three equal cards with the same three-row pattern become one "Three ways to hedge, at the stress rate" table (rows: hedged cost, unhedged, saving, rate). Larger change; only if time.
- **P3-7. Direct-label hedge lines** at the right end (`<Line label>` on the last point) and drop the top legend; saves a row of 13px legend text and helps print.
- **P3-8. Tour spotlight glides by animating top/left/width/height** (`index.css` `.tour-hole[data-glide]`). One element, rare, reduced-motion handled: acceptable; leave unless jank is seen.

Visuals pass: **no generated image needed.** This is an app, not a landing page; the moments are the three data views above. Do not add hero art, blobs or illustrations.

---

## (c) Do not change

- **Finance logic and numbers.** Nothing under `engine/`, `ai/guard.ts` logic, `verify.test.ts`, formatters in `ui/format.ts`. Every figure keeps its value and unit (MYR per 1 USD, rates as decimals internally). Colour/tone changes are display only; P1-8 changes a tone and a sentence, never a value.
- **Labels with meaning:** "Forward", "IRP forward", "PPP expected", "IFE", "Stress spot", "Spot (mid)", "Effective rate after spread", "vs spot", "you pay / you receive", the amber = costs more / teal = better mapping (and the +/- sign and word that always accompany it; no colour-only cue).
- **"Illustrative — not market rates"** stays visible in the header on every screen and at the top of the sidebar, plus the footer line "Educational tool. Illustrative rates, not market data. Not financial advice." and the same line in the tutor drawer. Keep `data-testid="illustrative-badge"`.
- **The AI number guard presentation:** every AI number stays marked verified / corrected / unverified; the "numbers checked against the engine" statement stays in the drawer header. The app must still run with no key (Offline mark stays, just quieter).
- **Emil-pass motion:** `--ease-out/--ease-in-out/--ease-drawer`, named `transition-property` lists (never `all`), 160ms button transition, `scale(0.97)` press, 4px `panel-enter`, `pop-enter` from the top-right, drawer slide with faster exit, tab underline `transform`-only slide, `msg-enter`, tooltip skip-delay, `prefers-reduced-motion` block, `@media (hover:hover)` gating. No new loops, springs or entrance flourishes. `animate-spin` stays only on real loading states.
- **Accessibility:** WCAG AA contrasts in MASTER (teal 5.5:1, amber 5.0:1; muted text never lighter than slate-600; placeholder slate-500), the single `:focus-visible` ring, 40-46px targets, `aria-describedby` on helped fields, `aria-pressed` and `role="tab"`/`radiogroup` semantics, sr-only "(verified)" text, `Term` focusability, 13px chart text for A3 print, dash patterns on chart lines.
- **Layout skeleton:** tab order, card order, the sticky 328px sidebar, `max-w-[1800px]`, light theme, IBM Plex, tabular figures (`.num`).
- Do not install packages without asking (P1-6 gives an inline-SVG route).

---

## (d) Copy rewrites (old to new)

Meaning and numbers unchanged. Items marked * need a small code change beyond a string swap.

| Where | Old | New |
|---|---|---|
| Header, tutor button | Ask the AI tutor | Ask the tutor (drawer title stays "AI tutor", for honesty) |
| Header, badge | ILLUSTRATIVE — NOT MARKET RATES (css caps) | Illustrative — not market rates |
| Sidebar, badge | ILLUSTRATIVE — not market rates | Illustrative — not market rates |
| Sidebar, card | Your deal (slot A) | Your deal · Scenario A |
| Sidebar, presets | Presets | Start from an example |
| Sidebar, presets help | Hover a preset for what it demonstrates. Loads into slot A. | Loads into Scenario A. |
| Sidebar, option fields | Option strike / Option premium (hint MYR/USD) | Strike / Premium (hint MYR per USD), under the sub-head "Option" |
| Budget h2 intro, last sentence | Higher MYR per USD = weaker ringgit. All rates are MYR per 1 USD. (repeated in every intro) | Show once, as a single line under the tab bar: "Higher MYR per USD means a weaker ringgit. All rates are MYR per 1 USD." |
| Budget card title | What you pay under each view | What you pay under each forecast |
| Budget card sub | Every row comes from the engine. Compare each guess with paying or receiving at today's price. | Each row is one guess at the future rate, priced by the engine. The last column shows the gap to today's rate. |
| Budget chart caption | Difference vs spot, in ringgit (amber = costs you more) | Difference vs spot, in ringgit (legend holds the colour key) |
| Budget spread sub * | Banks do not trade at the middle price. With a 0.00% bank margin, you buy dollars dearer than today's price. | At 0.00%: "The bank spread is 0.00%, so you trade at today's price. Raise it in the sidebar to see what the bank's margin costs." Above 0: keep the current sentence. |
| Limitations title | Limitations: what this model cannot tell you | What this model cannot tell you |
| Limitations sub | Read these before you use any number above for a real decision. | Read these before you rely on any figure here for a real payment. |
| Parity verdict sentences | costs LESS ringgit / MORE ringgit / brings you LESS / MORE | costs less ringgit / costs more ringgit / brings you less / more ringgit (use `<strong>` on "less/more", no capitals) |
| Parity identity title * | The identity: Forward ÷ PPP = (1 + r_MY) ÷ (1 + r_US) | Do the parities agree? (formula moves into the subtitle, mono) |
| Parity identity boxes | Left: Forward ÷ PPP / Right: (1 + r_MY) ÷ (1 + r_US) | Forward ÷ PPP / Real-rate ratio (1 + r_MY) ÷ (1 + r_US) |
| Scenarios h2 | Scenarios | Compare two what-ifs |
| Scenarios tip pill | Tip: edit slot A, switch to B, load another preset | (delete pill) add to intro: "Edit Scenario A, switch to B in the header, then load another example." |
| Tornado title | Tornado chart: which input matters most? | Which input moves your answer most? (subtitle opens "A tornado chart nudges each number by the same small step…") |
| Hedging chart title | Ringgit cost / receipt by future spot rate | What you pay (or receive) at each future rate |
| Option pill | Exercised at stress spot | Option is used at the stress rate |
| Option pill | Lapses (market rate is better) | Option lapses: the market rate is better |
| Money-market pill | Equals the forward: with no bank quote the forward is the IRP forward | Same as the forward, because no bank quote is entered |
| Arbitrage card | Quote to test | Test a bank's forward quote |
| Arbitrage helper (new) | none | "Starts from your sidebar values. Changes here stay on this screen." |
| Arbitrage direction text | Trade the cheaper side against the dearer one, as below. | The steps below lock in that gap. |
| Verify h2 | Verify against the lecturer's workbook | Checked against the lecturer's workbook |
| Verify pill | All checks pass | (remove when all pass; show "n checks fail" in red otherwise) |
| Practice inner heading | Quick question | Question 1 (counts up) |
| Practice | Direction / Roughly what value? | Which way does it move? / Your estimate |
| Practice buttons | ↑ Goes up / ↓ Goes down; Check my answer | Goes up / Goes down (icons); Check answer |
| Explain button | 💡 Explain | Explain (icon) |
| Explain loading | Explaining… | Explaining |
| Tutor tone label | Explain like I am a | Explain for |
| Tutor intro | Ask about interest rates, inflation, the forward rate or hedging. Try one of these: | Ask about rates, inflation, the forward or hedging. |
| Tutor input | Ask a question… | Ask about your numbers |
| Tutor loading | Thinking and checking the numbers… | Checking numbers against the engine |
| Tutor error | Sorry, something went wrong. Please try again. | The tutor could not answer. Try again. |
| Verified mark | ✓ 11/11 numbers verified | ✓ 11/11 numbers match the engine |
| Tooltip eyebrow | PLAIN WORDS / TEXTBOOK | Plain words / Textbook |
| Tour eyebrow | GUIDED TOUR · 3 OF 6 | Guided tour · 3 of 6 |

Copy that is already good and should stay: header tagline "Only the finance you need before you pay in dollars.", the sidebar help lines ("A bad-day rate to test your budget against."), "Show workings", "Your ringgit budget", "Should you hedge?", "Parity check", the glossary plain/example text, the toast "Explanations now in plain language".
