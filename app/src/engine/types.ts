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
