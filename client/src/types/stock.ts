export interface StockQuote {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  longName?: string;
  shortName?: string;
  marketCap?: number;
  trailingPE?: number;
  trailingAnnualDividendYield?: number;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  averageVolume?: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  dayLow?: number;
  dayHigh?: number;
  previousClose?: number;
  open?: number;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface StockNewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  summary: string;
  thumbnail?: string;
  relatedSymbols?: string[];
}

export interface StockWebSocketMessage {
  type: 'quote' | 'subscribe' | 'unsubscribe';
  symbol: string;
  data?: StockQuote;
  error?: string | null;
  timestamp?: number;
}