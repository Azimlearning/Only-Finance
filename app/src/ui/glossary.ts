/**
 * Plain-language glossary. One entry per finance term shown in the UI.
 *  - plain   (<= 25 words): everyday language, shown to "SME owner".
 *  - student (<= 35 words): textbook definition plus the formula or theory name, shown to "Student".
 *  - example (optional)   : one short Malaysian SME example, shown to both.
 * No numbers here depend on the engine; examples use round, illustrative figures only.
 */
export interface GlossaryEntry {
  term: string
  plain: string
  student: string
  example?: string
}

const entries = {
  // ---- Tabs: each says what the tab helps you decide ----
  tabBudget: {
    term: 'Budget',
    plain: 'Helps you decide what number to put in your ringgit budget for a dollar payment or receipt, using several views of the future rate.',
    student: 'Converts one USD amount into MYR under spot, forward, PPP-based, user and stress rates, so you can choose a budget rate and see the gap to spot.',
    example: 'A KL furniture importer paying a US supplier decides which rate to budget at.',
  },
  tabParity: {
    term: 'Parity Check',
    plain: 'Helps you decide whether the bank’s forward price is fair, by checking if interest rates, inflation and exchange rates tell the same story.',
    student: 'Tests the parity conditions (IRP, PPP, Fisher, IFE) and the identity Forward ÷ PPP = (1 + r_MY) ÷ (1 + r_US), then values any gap in MYR.',
  },
  tabScenarios: {
    term: 'Scenarios',
    plain: 'Helps you decide which assumption matters most, by comparing two what-if worlds and sliding one number at a time.',
    student: 'Scenario comparison, one-way sensitivity analysis and a tornado chart showing which input moves the forward and PPP rate most.',
  },
  tabHedging: {
    term: 'Hedging',
    plain: 'Helps you decide whether to lock in a rate or stay exposed, by comparing doing nothing, a forward, an option and a money-market hedge.',
    student: 'Compares unhedged, forward, currency option and money-market hedges across future spot rates, with break-even rates between strategies.',
  },
  tabArbitrage: {
    term: 'Arbitrage',
    plain: 'Helps you decide if a bank quote looks too good to be true: it tests whether a risk-free profit exists after the bank’s margin.',
    student: 'Covered interest arbitrage test: compares the quoted forward with the IRP forward and checks whether profit survives the bid-ask spread.',
  },
  tabVerify: {
    term: 'Verify',
    plain: 'Helps you decide whether to trust the numbers: every calculation here is checked against the lecturer’s worked answers.',
    student: 'Regression table comparing live engine outputs with the lecturer’s W05–06 workbook and Week 10 study-guide values, within a stated tolerance.',
  },
  tabPractice: {
    term: 'Practice',
    plain: 'Helps you decide if you really understand it: predict which way a number moves, and the engine marks your answer.',
    student: 'Self-test on comparative statics: change one assumption, predict the direction and size of the effect, and receive engine-scored feedback.',
  },

  // ---- Rates and basics ----
  spot: {
    term: 'Spot rate',
    plain: 'Today’s price of one US dollar in ringgit, if you swapped money right now.',
    student: 'The exchange rate for immediate delivery (S), quoted here as MYR per 1 USD. It is the starting point for forward and parity calculations.',
    example: 'If spot is 4.50, one US dollar costs RM 4.50 today.',
  },
  forward: {
    term: 'Forward rate',
    plain: 'A price for the dollar that the bank fixes today, for a payment on a future date.',
    student: 'The exchange rate agreed now for delivery at a set future date (F). Under covered interest parity it is set by the interest-rate gap, not a forecast.',
    example: 'Lock RM 4.45 today for a supplier invoice due in 90 days.',
  },
  myrPerUsd: {
    term: 'MYR per USD',
    plain: 'How many ringgit one dollar costs. Higher number means a weaker ringgit, so imports cost you more.',
    student: 'Direct quote with USD as the base currency. A rise in MYR/USD is a depreciation of the ringgit; a fall is an appreciation.',
    example: 'Going from 4.40 to 4.60 means each dollar of stock now costs more ringgit.',
  },
  interestRate: {
    term: 'Interest rate',
    plain: 'What a bank pays you to save, or charges you to borrow, for a year. It differs between Malaysia and the US.',
    student: 'The nominal annual rate of return on deposits or borrowing in a currency (i). The gap between two countries’ rates drives the forward rate under IRP.',
  },
  iMY: {
    term: 'i MY (Malaysian interest rate)',
    plain: 'The yearly interest rate on ringgit deposits and loans in Malaysia.',
    student: 'The nominal annual MYR interest rate (i_MY), the domestic leg of interest rate parity and the money-market hedge.',
  },
  iUS: {
    term: 'i US (US interest rate)',
    plain: 'The yearly interest rate on US dollar deposits and loans in America.',
    student: 'The nominal annual USD interest rate (i_US), the foreign leg of interest rate parity and the money-market hedge.',
  },
  inflation: {
    term: 'Inflation',
    plain: 'How fast prices rise each year. If Malaysian prices rise faster than US prices, the ringgit tends to buy less dollar over time.',
    student: 'The annual rate of increase in the general price level (π). The gap between two countries’ inflation drives the expected rate under relative PPP.',
  },
  realRate: {
    term: 'Real interest rate',
    plain: 'What your savings really earn after you take off rising prices. A 5% rate with 3% inflation earns about 2%.',
    student: 'Nominal rate adjusted for inflation: (1 + i) / (1 + π) − 1, approximately i − π. This is the Fisher effect relationship.',
  },
  irp: {
    term: 'Interest rate parity (IRP)',
    plain: 'The fair forward price. It makes the bank forward cancel out the interest you would earn in each currency, so nobody gets a free lunch.',
    student: 'Covered interest parity: F = S × (1 + i_MY·t) / (1 + i_US·t). The forward premium or discount offsets the interest differential.',
  },
  forwardPremium: {
    term: 'Forward premium / discount',
    plain: 'How much dearer (premium) or cheaper (discount) the forward dollar is compared with today’s price, as a percentage.',
    student: 'Forward premium or discount = F / S − 1. Positive means the foreign currency is at a forward premium; negative means a discount.',
  },
  ppp: {
    term: 'Purchasing power parity (PPP)',
    plain: 'The idea that over time the exchange rate drifts to cancel out different inflation, so a basket of goods costs about the same in both countries.',
    student: 'Relative PPP: E = S × ((1 + π_MY) / (1 + π_US))^years. The currency of the higher-inflation country is expected to depreciate.',
  },
  pppExpected: {
    term: 'PPP expected rate',
    plain: 'Where the exchange rate is expected to be later, based only on the inflation gap. It is a forecast, not a promise.',
    student: 'The future spot rate implied by relative PPP given the two inflation rates. Exact form uses the ratio; the approximation uses π_MY − π_US.',
  },
  fisher: {
    term: 'Fisher effect',
    plain: 'Interest rates move with inflation: lenders want extra interest to make up for prices rising, so the real return stays about the same.',
    student: 'Fisher equation: (1 + i) = (1 + r)(1 + π), approximately i ≈ r + π. Nominal rates embed expected inflation.',
  },
  ife: {
    term: 'International Fisher effect (IFE)',
    plain: 'The currency of the country with the higher interest rate is expected to weaken, so investors earn about the same everywhere.',
    student: 'IFE: the expected spot change equals the interest differential, E(S_t) = S × (1 + i_MY) / (1 + i_US). Real returns equalise across currencies.',
  },
  parity: {
    term: 'Parity',
    plain: 'When two prices or rates line up exactly, so there is no gain from switching between them.',
    student: 'An equilibrium condition linking interest rates, inflation and exchange rates (IRP, PPP, Fisher, IFE); deviations imply a mispricing or a forecast gap.',
  },
  parityIdentity: {
    term: 'The parity identity',
    plain: 'A check that the forward price and the inflation-based forecast agree. If both sides match, the forward is a fair price.',
    student: 'Combining IRP, PPP and Fisher gives Forward ÷ PPP-expected = (1 + r_MY) ÷ (1 + r_US). Both sides must be equal when parity holds.',
  },
  parityTriangle: {
    term: 'Parity triangle',
    plain: 'A picture linking three things you can see: interest rates, inflation and the exchange rate. Each side shows how two of them are connected.',
    student: 'Diagram of the three parity relationships: Fisher effect (rates and inflation), IRP/IFE (rates and exchange rate), relative PPP (inflation and exchange rate).',
  },

  // ---- Views and your own inputs ----
  stressSpot: {
    term: 'Stress spot',
    plain: 'A bad-day exchange rate you pick to test your budget against: how much would you pay if the ringgit weakened this far?',
    student: 'A user-chosen adverse spot rate at the payment date, used to stress-test the budget and to evaluate hedge payoffs.',
    example: 'You test RM 4.80 per dollar to see if the invoice still fits.',
  },
  userForecast: {
    term: 'Your own forecast',
    plain: 'Your own guess of the dollar rate on payment day, from your supplier, your bank or your gut. Optional.',
    student: 'An optional subjective forecast of the future spot rate, added as an extra row so it can be compared with the model-based views.',
  },
  quotedForward: {
    term: 'Bank-quoted forward',
    plain: 'The forward price your bank actually offers you. Leave it blank and the app uses the fair (parity) forward instead.',
    student: 'The market forward quoted by a bank, which includes its spread. If blank, the IRP forward is used; comparing the two tests for arbitrage.',
  },
  forecastViews: {
    term: 'Views of the future rate',
    plain: 'Several different guesses of the future exchange rate. Each one turns into a different ringgit amount for your budget.',
    student: 'Alternative expected-spot estimates: spot, IRP forward, PPP expected, IFE expected, user forecast and stress spot, each converted to MYR for the same USD amount.',
  },

  // ---- Options and hedging ----
  hedge: {
    term: 'Hedge',
    plain: 'Locking in a price today so a future move in the exchange rate cannot hurt your budget.',
    student: 'A position that offsets exchange-rate risk on an existing exposure, trading uncertainty for a known cost via forwards, options or the money market.',
    example: 'Buying dollars forward so a 90-day invoice has a fixed ringgit cost.',
  },
  unhedged: {
    term: 'Unhedged',
    plain: 'Doing nothing: you pay or receive whatever the market rate is on the day. It could be better or worse.',
    student: 'An open exposure settled at the spot rate on the payment date (S_T), so the MYR outcome moves one-for-one with the exchange rate.',
  },
  breakEven: {
    term: 'Break-even rate',
    plain: 'The future exchange rate at which two choices end up costing exactly the same. Beyond it, one choice wins.',
    student: 'The spot rate S_T at which two strategies give equal MYR outcomes, for example forward versus unhedged, or option versus forward after premium.',
  },
  forwardContract: {
    term: 'Forward contract',
    plain: 'A promise with the bank to swap dollars at a rate fixed today, on a set future date. It protects you but you cannot walk away.',
    student: 'A binding agreement to buy or sell currency at the forward rate F on a set date. It removes risk in both directions, with no upfront premium.',
  },
  option: {
    term: 'Currency option',
    plain: 'Insurance for your exchange rate: you pay a fee for the right, not the duty, to swap dollars at a set rate.',
    student: 'The right but not the obligation to buy (call) or sell (put) currency at the strike. The buyer pays a premium and keeps upside if the market moves favourably.',
  },
  call: {
    term: 'Call option',
    plain: 'The right to buy dollars at a set rate. Importers use it to cap the most they will pay.',
    student: 'An option to buy USD at the strike. Payoff per USD = max(S_T − strike, 0), used by importers to cap the MYR cost.',
  },
  put: {
    term: 'Put option',
    plain: 'The right to sell dollars at a set rate. Exporters use it to set the least they will receive.',
    student: 'An option to sell USD at the strike. Payoff per USD = max(strike − S_T, 0), used by exporters to floor the MYR receipt.',
  },
  strike: {
    term: 'Option strike',
    plain: 'The exchange rate written into the option. It is the worst rate you can be forced to accept.',
    student: 'The exercise price (X) at which the holder may buy or sell the currency. It sets the cap or floor on the hedged rate.',
  },
  premium: {
    term: 'Option premium',
    plain: 'The up-front fee you pay for the option, in ringgit for each dollar covered. You pay it even if you never use the option.',
    student: 'The price of the option, here MYR per USD, paid at the start. It is added to the effective cost and is the maximum loss of the buyer.',
  },
  moneyMarket: {
    term: 'Money-market hedge',
    plain: 'Lock the rate yourself by borrowing and saving in the two currencies today, instead of buying a contract from the bank.',
    student: 'Create a synthetic forward by borrowing one currency, converting at spot and depositing the other, so the exposure is covered through interest-rate legs.',
  },
  usdLeg: {
    term: 'USD leg and MYR leg',
    plain: 'The two halves of the money-market hedge: the dollar amount you set aside, and the ringgit you borrow or deposit to do it.',
    student: 'The foreign-currency deposit or loan sized by discounting the USD amount at i_US, and the matching domestic MYR borrowing or investment at i_MY.',
  },
  payoff: {
    term: 'Payoff chart',
    plain: 'Shows what you pay or receive in ringgit for every future exchange rate. Flat lines mean you are protected.',
    student: 'Profile of the MYR outcome against future spot S_T for each strategy. Flat segments show a fixed hedged rate; sloped lines show exposure.',
  },
  effectiveRate: {
    term: 'Effective rate',
    plain: 'The rate you really end up paying or getting once all costs, such as the bank margin or option fee, are included.',
    student: 'Total MYR outcome divided by USD amount, including spread or premium, so different strategies are compared on one MYR/USD scale.',
  },

  // ---- Bank and contract terms ----
  spread: {
    term: 'Bank spread',
    plain: 'The bank’s margin. It sells you dollars a bit dearer and buys them back cheaper than the middle price.',
    student: 'The bid-ask difference around the mid rate, quoted here as a percentage. It is a transaction cost that erodes hedging or arbitrage gains.',
    example: 'A 0.5% spread on a RM 100,000 payment costs about RM 500 extra.',
  },
  dayBasis: {
    term: 'Day basis (365 / 360)',
    plain: 'How many days the bank counts in a year when it works out interest. Different banks and currencies use 365 or 360.',
    student: 'The day-count convention in the tenor fraction t = days / basis. Ringgit usually uses ACT/365, US dollar money markets use ACT/360.',
  },
  tenor: {
    term: 'Days to payment (tenor)',
    plain: 'How many days until the money actually changes hands. A longer wait means more interest and more risk.',
    student: 'Time to maturity as a fraction of a year, t = days / basis. It scales the interest differential in the forward rate and the hedge legs.',
  },
  importer: {
    term: 'Importer',
    plain: 'A business that buys from abroad and pays in dollars. A weaker ringgit makes the bill bigger.',
    student: 'A firm with USD payables. It is short USD, so depreciation of MYR raises its cost; it buys USD forward or buys a call option.',
  },
  exporter: {
    term: 'Exporter',
    plain: 'A business that sells abroad and gets paid in dollars. A stronger ringgit makes the money you receive smaller.',
    student: 'A firm with USD receivables. It is long USD, so appreciation of MYR cuts its receipts; it sells USD forward or buys a put option.',
  },
  usdAmount: {
    term: 'USD amount',
    plain: 'The size of the payment or receipt in US dollars. Everything else is converted into ringgit from this number.',
    student: 'The foreign-currency transaction exposure in USD, multiplied by each rate to produce the MYR budget figure.',
  },
  cia: {
    term: 'Covered interest arbitrage',
    plain: 'A trade that earns a risk-free profit when the bank’s forward price does not match interest rates. Banks usually price it away.',
    student: 'Borrowing in one currency, investing in the other and covering with a forward. Profit exists only when the quoted forward differs from the IRP forward after spread.',
  },
  arbitrageProfit: {
    term: 'Profit before / after spread',
    plain: 'The gain from the trade, first ignoring the bank margin and then after paying it. Often the margin wipes it out.',
    student: 'The arbitrage gain per unit of currency, gross of bid-ask costs and then net of the spread; a net positive value signals a genuine opportunity.',
  },

  // ---- Analysis ----
  sensitivity: {
    term: 'Sensitivity',
    plain: 'How much your answer changes when you change just one number. Big change means that number matters a lot.',
    student: 'One-way sensitivity analysis: vary a single input across a range holding others fixed, and plot the effect on the forward and PPP rate.',
  },
  tornado: {
    term: 'Tornado chart',
    plain: 'A chart that ranks your assumptions from most to least important. The longest bar is the number to watch.',
    student: 'A ranked sensitivity chart: each input receives the same small shock and bars are sorted by the size of the output change.',
  },
  scenario: {
    term: 'Scenario',
    plain: 'A “what if” world made of one set of assumptions, for example inflation jumping. Compare worlds side by side.',
    student: 'A coherent set of input assumptions. Scenario A versus B comparison isolates which changed inputs drive differences in the outputs.',
  },
  presets: {
    term: 'Presets',
    plain: 'Ready-made example situations you can load with one click, so you do not have to type everything.',
    student: 'Stored illustrative scenarios (baseline, inflation shock and others) that load a full set of deal and assumption inputs.',
  },
  illustrative: {
    term: 'Illustrative rates',
    plain: 'Example numbers made up to teach with. They are not today’s real market rates, so never use them for a real deal.',
    student: 'Teaching inputs chosen to demonstrate the mechanics, not live quotes. No claim is made that they are current market rates.',
  },
  workings: {
    term: 'Workings',
    plain: 'The step-by-step sums behind a number, so you can see exactly how the app got it.',
    student: 'The formula, substituted values and result at each calculation step, matching the lecturer’s worked method.',
  },
  verifyMatch: {
    term: 'Match against the workbook',
    plain: 'A tick means the app gets the same answer as the lecturer’s worked solution.',
    student: 'The engine value is within tolerance of the reference value taken from the lecturer’s W05–06 workbook or the Week 10 guide.',
  },
} satisfies Record<string, GlossaryEntry>

export const GLOSSARY: Record<TermId, GlossaryEntry> = entries
export type TermId = keyof typeof entries
