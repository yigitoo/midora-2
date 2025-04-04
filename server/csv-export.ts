/**
 * Utility to convert stock data to CSV format for export
 */

import { HistoricalDataPoint } from "@/types/stock";

/**
 * Converts historical stock data to CSV format
 * @param data Array of historical data points
 * @returns CSV formatted string
 */
export function generateCsv(data: HistoricalDataPoint[]): string {
  if (!data || !data.length) {
    return "No data available";
  }
  
  // Define CSV headers
  const headers = ["Date", "Open", "High", "Low", "Close", "Volume", "Adjusted Close"];
  
  // Create CSV content with headers
  let csvContent = headers.join(",") + "\n";
  
  // Add data rows
  data.forEach(dataPoint => {
    const date = new Date(dataPoint.date).toISOString().split("T")[0]; // Format date as YYYY-MM-DD
    const row = [
      date,
      dataPoint.open.toFixed(2),
      dataPoint.high.toFixed(2),
      dataPoint.low.toFixed(2),
      dataPoint.close.toFixed(2),
      dataPoint.volume.toString(),
      dataPoint.adjClose ? dataPoint.adjClose.toFixed(2) : dataPoint.close.toFixed(2)
    ];
    
    csvContent += row.join(",") + "\n";
  });
  
  return csvContent;
}

/**
 * Generates advanced CSV with additional calculated metrics
 * @param symbol Stock symbol
 * @param data Array of historical data points
 * @returns CSV formatted string with additional metrics
 */
export function generateAdvancedCsv(symbol: string, data: HistoricalDataPoint[]): string {
  if (!data || !data.length) {
    return "No data available";
  }
  
  // Calculate additional metrics
  const enrichedData = calculateAdditionalMetrics(data);
  
  // Define CSV headers with additional metrics
  const headers = [
    "Date", "Symbol", "Open", "High", "Low", "Close", "Volume", 
    "Adjusted Close", "Daily Change (%)", "Daily Range (%)", 
    "5-Day MA", "10-Day MA", "30-Day MA", "RSI"
  ];
  
  // Create CSV content with headers
  let csvContent = headers.join(",") + "\n";
  
  // Add data rows
  enrichedData.forEach(point => {
    const date = new Date(point.date).toISOString().split("T")[0];
    const row = [
      date,
      symbol,
      point.open.toFixed(2),
      point.high.toFixed(2),
      point.low.toFixed(2),
      point.close.toFixed(2),
      point.volume.toString(),
      point.adjClose ? point.adjClose.toFixed(2) : point.close.toFixed(2),
      point.dailyChangePercent ? point.dailyChangePercent.toFixed(2) : "",
      point.dailyRangePercent ? point.dailyRangePercent.toFixed(2) : "",
      point.ma5 ? point.ma5.toFixed(2) : "",
      point.ma10 ? point.ma10.toFixed(2) : "",
      point.ma30 ? point.ma30.toFixed(2) : "",
      point.rsi ? point.rsi.toFixed(2) : ""
    ];
    
    csvContent += row.join(",") + "\n";
  });
  
  return csvContent;
}

/**
 * Calculates additional technical metrics for historical data
 * @param data Array of historical data points
 * @returns Enhanced data with additional metrics
 */
function calculateAdditionalMetrics(data: HistoricalDataPoint[]) {
  // Create a copy to avoid mutating original data
  const enrichedData = [...data].map((point, index, array) => {
    const prevDay = index > 0 ? array[index - 1] : null;
    
    // Daily change percentage
    const dailyChangePercent = prevDay 
      ? ((point.close - prevDay.close) / prevDay.close) * 100 
      : null;
    
    // Daily range percentage
    const dailyRangePercent = ((point.high - point.low) / point.low) * 100;
    
    // Calculate moving averages
    const ma5 = calculateMA(array, index, 5);
    const ma10 = calculateMA(array, index, 10);
    const ma30 = calculateMA(array, index, 30);
    
    // Calculate RSI (14-period)
    const rsi = calculateRSI(array, index, 14);
    
    return {
      ...point,
      dailyChangePercent,
      dailyRangePercent,
      ma5,
      ma10,
      ma30,
      rsi
    };
  });
  
  return enrichedData;
}

/**
 * Calculates simple moving average
 * @param data Array of data points
 * @param currentIndex Current index
 * @param period Period for the moving average
 * @returns Moving average value or null if not enough data
 */
function calculateMA(data: HistoricalDataPoint[], currentIndex: number, period: number): number | null {
  if (currentIndex < period - 1) {
    return null;
  }
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[currentIndex - i].close;
  }
  
  return sum / period;
}

/**
 * Calculates Relative Strength Index (RSI)
 * @param data Array of data points
 * @param currentIndex Current index
 * @param period Period for RSI calculation
 * @returns RSI value or null if not enough data
 */
function calculateRSI(data: HistoricalDataPoint[], currentIndex: number, period: number): number | null {
  if (currentIndex < period) {
    return null;
  }
  
  let gains = 0;
  let losses = 0;
  
  for (let i = currentIndex - period + 1; i <= currentIndex; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  
  if (losses === 0) {
    return 100;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  
  return 100 - (100 / (1 + rs));
}
