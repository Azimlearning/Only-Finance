# OnlyFinance — Sources & References

> Raw research and external dependencies. The PRD is the *decided* view; this file is the *considered* view, including things that were looked at and rejected.

Last updated: 2026-11-11

---

## Founding context documents

| Document | What it gives us |
|---|---|
| *Note* | Items under `context/` other than `context/notes/` are local only, not in the public repo |
| `context/brief/Project-Guidelines-FinBridge-AI.pdf` (+ `.md`) | **Controlling document.** Purpose, scope, mandatory features, deliverables, rubric, integrity rules, deadline |
| `context/workbook/W05-06-Excel-Calculation-Workbook.xlsx` (+ `.md`) | Lecturer's formulas and cached values: the test oracle |
| `context/lectures/W05-06-Parity-Relationships-FX-Forecasting-Currency-Derivatives.pdf` (+ `.md`) | IRP, CIA, PPP, Fisher, forecasting approaches, forwards/futures/options as taught |
| `context/lectures/W10-Visual-Study-Guide-Parities-Hedging-Borrowing.pdf` (+ hand transcription `.md`) | CIRP/PPP/Fisher worked examples at S 4.50; parity triangle; importer hedge; borrowing comparison. AI-generated (Gemini Notebook); decorative stats on slide 2 not to be cited |
| `context/notes/FinBridgeAI-Project-Notes.md` | Earlier session: direction choice, SME evidence with sources, BNM/MOF/international-body research, verified worked example |
| `context/notes/OnlyFinance-Brainstorm-2026-11-11.md` | Concept, parity identity, scenarios, marketability, video and poster plan |
| `context/lectures/W01–W03`, `context/tutorials/` | Course background (MNC management, flow of funds, FX market, BOP); not scope-defining |

---

## External code & libraries

| Name | What it does for us | Link | License | Status |
|---|---|---|---|---|
| Vite | Dev server, build, `/api/llm` proxy | https://vite.dev | MIT | Chosen |
| React | UI | https://react.dev | MIT | Chosen |
| TypeScript | Types for finance code | https://www.typescriptlang.org | Apache-2.0 | Chosen |
| Tailwind CSS | Styling | https://tailwindcss.com | MIT | Chosen (ASSUMED OK) |
| Recharts | Bar, line, payoff and tornado charts | https://recharts.org | MIT | Chosen (ASSUMED OK) |
| Vitest | The single end-of-build test | https://vitest.dev | MIT | Chosen |

---

## APIs & services

| Service | Used for | Pricing model | Auth / key location | Status |
|---|---|---|---|---|
| OpenRouter (chat completions, OpenAI-compatible, tool calling) | A0/A1/A3/A5 AI features | Pay per token per model (some free models exist) | `OPENROUTER_API_KEY` in root `.env.local`, read only by the Vite dev proxy | Chosen; key and model pending from user |

Keys live in `.env.local` (git-ignored) and are read server-side only. Never commit a key; never expose one to a client bundle.

---

## Reference material

Theory and data sources for the poster and limitations (see `context/notes/FinBridgeAI-Project-Notes.md` §5, §7–§14 for the full list with reliability notes): BNM Foreign Exchange Policy pages (export repatriation, 2021 liberalisation), SME Corp Malaysia MSME 2025 performance, DOSM via OECD MSME distribution 2024, ACCA-Kantox (2013) on SME hedging, ICC Incoterms, IMF, FSB cross-border payments.

---

## Considered and rejected

| Option | Why it looked good | Why it lost | Recorded in |
|---|---|---|---|
| AI computes all numbers, no engine | Seemed faster; feels "AI-enabled" | Brief §1/§4 require a correct finance model and verification of AI answers; LLM arithmetic risks the 35 accuracy marks | D-03 |
| Single HTML file / Streamlit | Fastest prototypes | User chose React + Vite | D-02 |
| `VITE_` key in the browser | Simplest AI call | Key visible in the bundle and screen recordings | D-04 |
| Vercel deploy with serverless proxy | Shareable link | User: localhost only | D-04 |
| Per-task microtests | Catch bugs early | User: one test pass at the end to save time and tokens | D-11 |
| doc-keeper subagent | Automates doc upkeep | `/session-end` covers it with less context cost | D-10 |
| Multi-country Regulator Tally, landed cost, Incoterms, live rates | Marketability extras | Out of the confirmed scope; roadmap slide only | D-05 |
