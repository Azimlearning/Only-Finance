export const LIMITATIONS: { title: string; text: string }[] = [
  {
    title: 'PPP holds mainly in the long run',
    text: 'Purchasing power parity describes where exchange rates drift over many years. Over a few months, rates are driven by flows, sentiment and policy, so the PPP expected spot is a benchmark, not a short-term forecast.',
  },
  {
    title: 'IRP ignores transaction costs, taxes and capital controls',
    text: 'The interest rate parity forward assumes you can borrow and lend freely at the quoted rates with no dealing spread, tax or restrictions on moving money. Real arbitrage profits shrink or vanish once these are included.',
  },
  {
    title: 'The implied forward is not the bank-quoted forward',
    text: 'IRP gives a theoretical forward from interest rates. A bank quotes its own forward with its margin and funding costs, so the two usually differ. Always get a real quote before deciding.',
  },
  {
    title: 'Forecasts are not predictions',
    text: 'The forward, PPP, Fisher and stress views are scenarios to plan around. None of them says where the exchange rate will actually be on the payment date.',
  },
  {
    title: 'The International Fisher effect assumes equal real rates',
    text: 'IFE links expected spot changes to the interest rate gap only if real returns are equal across countries and capital moves freely. When real rates differ, the expected spot it produces is less reliable.',
  },
  {
    title: 'Simple-interest tenor scaling and a stated day-count',
    text: 'For periods other than one year, interest is scaled simply as rate × days ÷ basis (365 or 360). Real contracts may use compounding or other conventions, which changes the figures slightly.',
  },
  {
    title: 'Illustrative rates, not market data',
    text: 'Every preset uses made-up or lecture rates chosen to teach a point. They are not current market quotes and should not be used to price a real deal.',
  },
  {
    title: 'Educational tool, not financial advice',
    text: 'OnlyFinance is a learning aid for the CLO3 course. Nothing here is a recommendation to buy, sell or hedge. Speak to a qualified adviser or your bank before making a decision.',
  },
];
