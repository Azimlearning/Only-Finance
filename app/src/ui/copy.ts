/**
 * Descriptive copy keyed by tone ("SME owner" vs "Student"). Wording only: every figure is passed in
 * already formatted from the engine, so switching tone never changes a number.
 */
import { useApp } from './state'
import type { Tone } from './state'

const sme = {
  budgetIntro: (usd: string, noun: string, days: number, pay: string) =>
    `For a USD ${usd} ${noun} in ${days} days: each row is one guess of where the dollar price could be, and what ${pay} in ringgit if that guess comes true.`,
  budgetForecastSub: "Each row is one guess at the future rate, priced by the engine. The last column shows the gap to today's rate.",
  // `zero` comes from the engine result (extra cost is 0), so the sentence never contradicts the figure.
  budgetSpreadSub: (pct: string, importer: boolean, zero: boolean) =>
    zero
      ? `The bank spread is ${pct}, so you trade at today's price. Raise it in the sidebar to see what the bank's margin costs.`
      : `Banks do not trade at the middle price. With a ${pct} bank margin, ${importer ? 'you buy dollars dearer' : 'you sell dollars cheaper'} than today's price.`,
  limitationsSub: 'Read these before you rely on any figure here for a real payment.',
  ratesNote: "Example rates for learning, not today's market.",

  parityIntro:
    "Interest rates, inflation and the exchange rate are linked. If they all line up, the bank's forward price and the inflation-based forecast should agree. Shown over one year.",
  triangleSub: 'Each corner is something you can see. Each side shows how two corners are connected, with its live number.',
  irpSub: 'The fair forward price: the rate where saving in ringgit or in dollars earns you the same.',
  pppSub: 'Where the rate is expected to go if it cancels out the difference in price rises.',
  realSub: 'What savings earn after taking off rising prices.',
  ifeSub: 'The rate you would expect if the interest-rate gap predicted the currency move.',
  identitySub: 'Both sides must be equal. The left compares the two forecasts; the right is the gap between the real interest rates.',

  scenariosIntro:
    'Test your assumptions: compare two what-if worlds side by side, slide one number to see its effect, and rank which number moves your budget most. Edit Scenario A, switch to B in the header, then load another example.',
  compareSub: 'Load a different example into each scenario (switch between them in the header), then see which inputs changed and how every result moved.',
  sensitivitySub: 'Pick one number and widen the range. The two lines show the bank-style forward and the inflation-based forecast.',
  tornadoSub: 'A tornado chart nudges each number by the same small step (rates +1 pp, spot +0.10). Longer bars mean your answer reacts more to that number.',

  hedgingIntro: (verb: string, stress: string) =>
    `Compare what ${verb} in ringgit if you do nothing, lock a forward, buy an option or use the money market, across every rate the ringgit could reach. Bad-day case: the dollar reaches ${stress}.`,
  payoffSub: 'Flat lines are protected. The unhedged line moves one-for-one with the market. Vertical markers are where two choices cost the same.',
  forwardSub: (rate: string, quote: boolean, stress: string) =>
    `Lock ${rate} today${quote ? ' (your bank quote)' : ' (the fair parity forward)'}. Bad-day rate ${stress}.`,
  optionSub: (importer: boolean, strike: string, prem: string) =>
    `${importer ? 'The right to buy dollars' : 'The right to sell dollars'} at ${strike}; you pay ${prem} per dollar up front.`,
  moneyMarketSub: 'Borrow or save in each currency today so the payment is covered, without buying a forward from the bank.',

  arbitrageIntro:
    "Sometimes a bank's forward price does not match what interest rates imply. Borrowing in one currency and saving in the other could then lock in a risk-free gain. In practice the bank's margin usually removes it.",
  quoteSub: 'Type the forward rate a bank quotes you. The engine compares it with the fair (parity) forward.',
  quoteHelp: 'Starts from your sidebar values. Changes here stay on this screen.',
  arbitrageGap: 'The steps below lock in that gap.',
  ciaSub: 'If the quote differs from the fair forward, a risk-free profit may exist before costs. The bank margin shows whether it survives.',

  verifyIntro:
    "Every calculation in this app is checked against the lecturer's worked answers. The engine value is computed live here, so a mistake would show up as a cross.",
  practiceIntro: 'Test your instinct: change an assumption, predict which way the number moves, and the engine marks your answer.',
}

const student: typeof sme = {
  budgetIntro: (usd, noun, days, pay) =>
    `For a USD ${usd} ${noun} in ${days} days: each row converts one expected-spot estimate (spot, IRP forward, PPP, IFE, user, stress) into the MYR you ${pay.replace(/^you /, '')}.`,
  budgetForecastSub: 'Each row is one estimate of the future rate, priced by the engine. The vs spot column compares it with the spot outcome.',
  budgetSpreadSub: (pct, importer, zero) =>
    zero
      ? `At a ${pct} spread, bid and ask equal the mid rate, so there is no transaction cost. Raise the spread in the sidebar to see its effect.`
      : `Banks quote bid and ask around the mid rate. At a ${pct} spread, ${importer ? 'buying USD costs more than mid' : 'selling USD yields less than mid'}: a transaction cost on top of exchange-rate risk.`,
  limitationsSub: 'Model assumptions and caveats to read before relying on any figure for a real payment.',
  ratesNote: 'Illustrative rates, not market data.',

  parityIntro:
    "Three parity conditions tie interest rates (IRP, IFE), inflation (relative PPP) and real rates (Fisher) to the exchange rate. If all hold, the forward and the PPP forecast reconcile. Horizon shown: one year.",
  triangleSub: 'Each corner is an observable. Each edge is the parity relationship linking two corners, with its live value.',
  irpSub: 'Covered interest parity: F = S × (1 + i_MY·t) / (1 + i_US·t), the forward that leaves no covered arbitrage between MYR and USD deposits.',
  pppSub: 'Relative PPP: E = S × ((1 + π_MY) / (1 + π_US))^years, the rate that offsets the inflation differential.',
  realSub: 'Fisher equation: real rate = (1 + i) / (1 + π) − 1, approximately i − π.',
  ifeSub: 'International Fisher effect: expected spot change equals the nominal interest differential, E(S_t) = S × (1 + i_MY) / (1 + i_US).',
  identitySub: 'Forward ÷ PPP must equal (1 + r_MY) ÷ (1 + r_US) when all parities hold. The left compares forecasts; the right compares real rates.',

  scenariosIntro:
    'Scenario analysis: compare two assumption sets, run one-way sensitivity on a single input, and rank inputs by impact with a tornado chart. Edit Scenario A, switch to B in the header, then load another preset.',
  compareSub: 'Load a preset into each scenario (switch between them in the header) to see which inputs changed and how every output moved.',
  sensitivitySub: 'One-way sensitivity: vary a single input across a range. Lines show the IRP forward and the PPP expected rate.',
  tornadoSub: 'A tornado chart shocks each input by the same small step (rates +1 pp, spot +0.10). Longer bars mean larger output sensitivity.',

  hedgingIntro: (verb, stress) =>
    `Compare the MYR you ${verb.replace(/^you /, '')} under no hedge, a forward, a currency option and a money-market hedge across all spot outcomes at maturity. Stress case: S_T = ${stress}.`,
  payoffSub: 'Payoff profile in MYR against S_T. Flat segments are fixed by the hedge; the unhedged line is linear in S_T. Vertical markers are break-even rates.',
  forwardSub: (rate, quote, stress) => `Fix F = ${rate}${quote ? ' (bank quote)' : ' (IRP forward)'}. Stress S_T = ${stress}.`,
  optionSub: (importer, strike, prem) =>
    `${importer ? 'Call: right to buy USD' : 'Put: right to sell USD'} at strike ${strike}; premium ${prem} per USD paid upfront.`,
  moneyMarketSub: 'Synthetic forward: borrow and deposit in each currency today so the payment is funded, replicating the covered-parity rate.',

  arbitrageIntro:
    "Covered interest arbitrage: if the quoted forward deviates from the IRP forward, borrowing in one currency, investing in the other and covering with a forward could earn a risk-free profit. Bid-ask spreads usually eliminate it.",
  quoteSub: 'Enter a bank forward quote. The engine compares it with the IRP forward and applies your spread.',
  quoteHelp: 'Starts from your sidebar values. Changes here stay on this screen.',
  arbitrageGap: 'The steps below lock in that gap.',
  ciaSub: 'A deviation from the IRP forward implies gross arbitrage profit; the spread determines whether it survives as net profit.',

  verifyIntro:
    "Regression check: each engine output is compared with the lecturer's W05–06 workbook and Week 10 study-guide values within tolerance. Values are computed live, so an error shows as a cross.",
  practiceIntro: 'Comparative statics drill: change one assumption, predict the direction and size of the effect, and the engine scores your answer.',
}

export const COPY: Record<Tone, typeof sme> = { sme, student }

export function useCopy(): typeof sme {
  return COPY[useApp().state.tone]
}

export const TONE_TOAST: Record<Tone, string> = {
  sme: 'Explanations now in plain language',
  student: 'Explanations now include textbook terms',
}
