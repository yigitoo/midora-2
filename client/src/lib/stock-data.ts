import { StockQuote, HistoricalDataPoint, MarketIndex } from "@/types/stock";
import { apiRequest } from "@/lib/queryClient";

/**
 * Fetches stock quote data for a specific symbol
 * @param symbol Stock symbol (e.g., "AAPL")
 * @returns Promise with stock quote data
 */
export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  try {
    const response = await apiRequest("GET", `/api/stocks/${symbol}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    throw new Error(`Failed to fetch stock data for ${symbol}`);
  }
}

/**
 * Fetches historical stock data for charts
 * @param symbol Stock symbol
 * @param period Time period ("1d", "5d", "1mo", "3mo", "1y", "5y")
 * @param interval Data interval ("1m", "5m", "15m", "1d", "1wk", "1mo")
 * @returns Promise with historical data points
 */
export async function fetchHistoricalData(
  symbol: string,
  period: string = "1d",
  interval: string = "5m"
): Promise<HistoricalDataPoint[]> {
  try {
    const response = await apiRequest(
      "GET",
      `/api/stocks/${symbol}/history?period=${period}&interval=${interval}`
    );
    return await response.json();
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw new Error(`Failed to fetch historical data for ${symbol}`);
  }
}

/**
 * Fetches major market indices data
 * @returns Promise with market indices data
 */
export async function fetchMarketIndices(): Promise<MarketIndex[]> {
  try {
    const response = await apiRequest("GET", "/api/market/indices");
    return await response.json();
  } catch (error) {
    console.error("Error fetching market indices:", error);
    throw new Error("Failed to fetch market indices");
  }
}

/**
 * Adds a stock to a watchlist
 * @param watchlistId Watchlist ID
 * @param symbol Stock symbol to add
 * @returns Promise with added item data
 */
export async function addToWatchlist(watchlistId: number, symbol: string) {
  try {
    const response = await apiRequest(
      "POST",
      `/api/watchlists/${watchlistId}/items`,
      { symbol }
    );
    return await response.json();
  } catch (error) {
    console.error(`Error adding ${symbol} to watchlist:`, error);
    throw new Error(`Failed to add ${symbol} to watchlist`);
  }
}

/**
 * Removes a stock from a watchlist
 * @param watchlistId Watchlist ID
 * @param symbol Stock symbol to remove
 */
export async function removeFromWatchlist(watchlistId: number, symbol: string) {
  try {
    await apiRequest(
      "DELETE",
      `/api/watchlists/${watchlistId}/items/${symbol}`
    );
  } catch (error) {
    console.error(`Error removing ${symbol} from watchlist:`, error);
    throw new Error(`Failed to remove ${symbol} from watchlist`);
  }
}

/**
 * Exports stock data to CSV
 * @param symbol Stock symbol
 * @param period Time period for data
 */
export function exportStockData(symbol: string, period: string = "1mo") {
  // Open a new window to download the CSV file
  window.open(`/api/export/${symbol}?period=${period}`, "_blank");
}

/**
 * Formats a number as currency
 * @param value Number to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats large numbers with appropriate suffix (K, M, B, T)
 * @param value Number to format
 * @returns Formatted number string
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  } else {
    return value.toFixed(2);
  }
}

/**
 * Formats a percentage value
 * @param value Percentage value
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
