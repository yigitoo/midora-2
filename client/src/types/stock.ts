// Stock Quote data from Yahoo Finance API
export interface StockQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  averageDailyVolume10Day?: number;
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  dividendYield?: number;
  dividendRate?: number;
  trailingAnnualDividendRate?: number;
  trailingAnnualDividendYield?: number;
  epsTrailingTwelveMonths?: number;
  epsForward?: number;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  beta?: number;
  exchange?: string;
  market?: string;
  currency?: string;
  timestamp?: number;
  error?: boolean;
}

// Historical data point for stock charts
export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

// Stock news item
export interface StockNewsItem {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
  summary: string;
  thumbnail?: string;
  related: string[];
}

// Market index data
export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
}

// Company financial data
export interface CompanyFinancials {
  symbol: string;
  currency: string;
  totalRevenue?: number;
  grossProfit?: number;
  netIncome?: number;
  operatingIncome?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  totalCash?: number;
  totalDebt?: number;
  ebitda?: number;
  quickRatio?: number;
  currentRatio?: number;
  debtToEquity?: number;
  returnOnEquity?: number;
  returnOnAssets?: number;
  freeCashFlow?: number;
  operatingCashFlow?: number;
  earningsGrowth?: number;
  revenueGrowth?: number;
  grossMargin?: number;
  operatingMargin?: number;
  profitMargin?: number;
}

// Recommendation trends
export interface RecommendationTrend {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

// Earnings data
export interface EarningsData {
  date: string;
  epsEstimate: number;
  epsActual: number;
  revenueEstimate: number;
  revenueActual: number;
  quarter: string;
  year: number;
}
