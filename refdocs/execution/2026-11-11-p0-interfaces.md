# P0 Interfaces Contract (binding for all P0 agents)

> Companion to `2026-11-11-p0-one-shot-build.md`. Agents build in parallel against these exact names and shapes. **Do not rename or reshape anything here.** If something is impossible, implement the closest version and report it; don't silently change the contract.
> Conventions: S/F = MYR per 1 USD; rates are decimals; `t = days / basis`; days omitted → t = 1 (one year exactly). All numbers are raw (unrounded); formatting is a UI concern.

## File ownership

| Owner | Files |
|---|---|
| Engine agent | `app/src/engine/**` |
| UI agent | `app/src/ui/**`, `app/src/App.tsx`, `app/src/main.tsx`, `app/src/index.css` (append only) |
| AI agent | `app/src/ai/**` |
| Test agent | `app/src/verify.test.ts` |

## `app/src/engine/types.ts`

```ts
export type Mode = 'importer' | 'exporter';
export type DayBasis = 365 | 360;
export type SensInput = 'iMY' | 'iUS' | 'piMY' | 'piUS' | 'spot';
export interface Step { label: string; formula: string; substituted: string; result: string }
export interface Result<T> { value: T; workings: Step[] }
export interface Deal { mode: Mode; usdAmount: number; days: number; basis: DayBasis; spot: number }
export interface Assumptions {
  iMY: number; iUS: number; piMY: number; piUS: number;   // decimals
  stressSpot: number;
  userForecast?: number;
  quotedForward?: number;      // bank-quoted forward; if absent, the IRP forward is used
  optionStrike: number;        // MYR per USD
  optionPremium: number;       // MYR per USD
  spread: number;              // decimal, e.g. 0.005
}
export interface Scenario { id: string; name: string; illustrative: true; deal: Deal; a: Assumptions; note?: string }
```

## Engine functions (exported from `app/src/engine/index.ts`)

Every calculation function returns `Result<…>` with the value shape below and a non-empty `workings` (formula → substituted → result).

| File | Signature | `value` shape |
|---|---|---|
| tenor.ts | `periodRate(p: { annual: number; days: number; basis: DayBasis })` | `{ rate, t }` |
| parity.ts | `irpForward(p: { spot; iMY; iUS; days?; basis? })` | `{ forward, premium, forwardMinusSpot }` (premium = F/S − 1) |
| parity.ts | `pppExpected(p: { spot; piMY; piUS; years? })` | `{ expected, change, approx, approxChange }` (exact = S·((1+πMY)/(1+πUS))^years; approx = S(1+(πMY−πUS)·years)) |
| parity.ts | `fisherReal(p: { i; pi })` | `{ real, approx }` |
| parity.ts | `fisherNominal(p: { real; pi })` | `{ nominal, approx, diff }` |
| parity.ts | `ifeExpected(p: { spot; iMY; iUS; days?; basis? })` | `{ expected, change }` |
| parity.ts | `parityCheck(p: { spot; iMY; iUS; piMY; piUS; usdAmount })` | `{ forward, pppExpected, realMY, realUS, ratio, realRatio, myrAtForward, myrAtPPP, gapMYR, verdict: 'forwardCheaper' \| 'forwardDearer' \| 'aligned' }` (gapMYR = myrAtPPP − myrAtForward; aligned if \|ratio−1\| < 0.0005) |
| arbitrage.ts | `ciaCheck(p: { spot; quotedForward; iMY; iUS; spread?; notional? })` | `{ irpForward, direction: 'borrowUSD_investMYR' \| 'borrowMYR_investUSD' \| 'none', unit: 'USD' \| 'MYR', profitPerUnit, profitPerUnitNoSpread, profitTotal }` |
| arbitrage.ts | `ciaCompare(p: { amount; homeRate; foreignRate; spot; forward })` | `{ homeMaturity, foreignBought, foreignMaturity, hedgedHome, extra, extraPct }` (workbook W5 CIA; spot/forward = home per 1 foreign) |
| budget.ts | `importBudget(p: { usd; rateOld; rateNew })` | `{ oldMYR, newMYR, diff, diffPct }` |
| budget.ts | `withSpread(p: { rate; spread; side: 'buyUSD' \| 'sellUSD'; usd? })` | `{ effectiveRate, extraMYR }` |
| budget.ts | `forecastViews(s: Scenario)` | `{ rows: { key: 'spot' \| 'forward' \| 'ppp' \| 'ife' \| 'stress' \| 'user'; label: string; rate: number; myr: number; vsSpot: number }[] }` |
| hedging.ts | `forwardHedge(p: { usd; forward; spotAtMaturity })` | `{ hedged, unhedged, saving, effectiveRate }` |
| hedging.ts | `optionHedge(p: { usd; strike; premium; spotAtMaturity; type: 'call' \| 'put' })` | `{ intrinsic, netPerUnit, gross, totalPremium, netBenefit, effectiveMYR, unhedgedMYR, exercised }` (call: effective = (min(S,K)+p)·usd; put: effective = (max(S,K)−p)·usd) |
| hedging.ts | `optionPayoffs(p: { strike; spot; premium })` | `{ callIntrinsic, putIntrinsic, callNet, putNet }` |
| hedging.ts | `moneyMarketHedge(p: { usd; spot; iMY; iUS; days?; basis?; mode: Mode })` | `{ usdLeg, myrLeg, myrAtMaturity, impliedRate }` |
| hedging.ts | `hedgeComparison(s: Scenario, spots?: number[])` | `{ points: { spot, unhedged, forward, option, moneyMarket }[] }` |
| hedging.ts | `breakEvens(p: { forward; strike; premium; mode: Mode })` | `{ forwardVsUnhedged, optionVsUnhedged, optionVsForward }` (importer: F, K+p, F−p; exporter: F, K−p, F+p) |
| scenarios.ts | `compareScenarios(a: Scenario, b: Scenario)` | `{ changedInputs: { key, from, to }[], outputs: { key, label, a, b, delta }[] }` |
| scenarios.ts | `sensitivity(s: Scenario, input: SensInput, values: number[])` | `{ points: { x, forwardMYR, pppMYR }[] }` |
| scenarios.ts | `tornado(s: Scenario)` | `{ bars: { input: SensInput, bump, forwardDelta, pppDelta }[] }` (rates +0.01, spot +0.10; sorted by max abs delta, descending) |

Non-calculation exports:

```ts
export const PRESETS: Scenario[];                 // ids: 'lecturer' | 'baseline' | 'inflationShock' | 'rateGap' | 'week10'
export function getPreset(id: string): Scenario;  // helper (not a tool)
export const LIMITATIONS: { title: string; text: string }[];
export interface OracleCase { id: string; source: string; description: string; actual: () => number; expected: number; tolerance: number; unit: 'rate' | 'MYR' | 'USD' | 'pct' | 'ratio' }
export const ORACLE: OracleCase[];                // one case per expected number in the execution doc Task 6 table
export const CALC_FUNCTION_NAMES: readonly string[]; // exactly the calculation function names in the table above
export * from './types';
```

## AI layer (`app/src/ai/`)

```ts
// tools.ts
export interface Tool { name: string; description: string; parameters: object /* JSON Schema */; run: (args: any) => unknown }
export const TOOLS: Tool[];
export const ENGINE_TOOL_NAMES: string[];          // must contain every name in CALC_FUNCTION_NAMES
export function runTool(name: string, args: unknown): { result: unknown; numbers: number[] };

// guard.ts
export type Segment = { kind: 'text'; text: string }
  | { kind: 'number'; raw: string; value: number; status: 'verified' | 'corrected' | 'unverified'; correct?: number };
export interface GuardResult { segments: Segment[]; verified: number; total: number }
export function collectNumbers(obj: unknown): number[];          // deep-walks objects/arrays for finite numbers
export function verifyNumbers(text: string, known: number[]): GuardResult;

// client.ts
export type Tone = 'student' | 'sme';
export interface ChatMessage { role: 'user' | 'assistant'; content: string }
export interface TutorReply { text: string; guard: GuardResult; toolCalls: { name: string; args: unknown }[]; offline: boolean }
export function askTutor(history: ChatMessage[], scenario: Scenario, tone: Tone): Promise<TutorReply>;
export function explain(topic: string, data: unknown, scenario: Scenario, tone: Tone): Promise<TutorReply>;
```

React components (in `app/src/ai/components/`, default exports not allowed, use these named exports):

```ts
export function TutorDrawer(props: { scenario: Scenario; open: boolean; onClose: () => void }): JSX.Element;
export function ExplainButton(props: { topic: string; data: unknown; scenario: Scenario }): JSX.Element;
export function PracticeTab(): JSX.Element;
export function GuardedText(props: { guard: GuardResult }): JSX.Element;
```

Import paths the UI uses: `import { TutorDrawer, ExplainButton, PracticeTab } from '../ai/components'` (an `index.ts` barrel in `app/src/ai/components/`).

## Globals

`__LLM_ENABLED__: boolean` (declared in `vite-env.d.ts`); `import.meta.env.VITE_OPENROUTER_MODEL`. The API call goes to same-origin `POST /api/llm` with an OpenAI-compatible chat-completions body (`model`, `messages`, `tools`, `tool_choice: 'auto'`).
