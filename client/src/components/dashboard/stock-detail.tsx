import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatNumber, formatPercentage } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { StockQuote, HistoricalDataPoint } from "@/types/stock";

type TimeframeOption = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";

const timeframeToQuery: Record<TimeframeOption, { period: string, interval: string }> = {
  "1D": { period: "1d", interval: "5m" },
  "1W": { period: "5d", interval: "15m" },
  "1M": { period: "1mo", interval: "1d" },
  "3M": { period: "3mo", interval: "1d" },
  "1Y": { period: "1y", interval: "1wk" },
  "5Y": { period: "5y", interval: "1mo" }
};

interface StockDetailProps {
  symbol?: string;
}

const StockDetail = ({ symbol = "AAPL" }: StockDetailProps) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>("1D");
  
  const { data: stockData, isLoading: isLoadingStock } = useQuery<StockQuote>({
    queryKey: [`/api/stocks/${symbol}`],
    enabled: Boolean(symbol)
  });
  
  const { data: historicalData, isLoading: isLoadingHistory } = useQuery<HistoricalDataPoint[]>({
    queryKey: [`/api/stocks/${symbol}/history`, timeframe],
    queryFn: async () => {
      const { period, interval } = timeframeToQuery[timeframe];
      const res = await apiRequest("GET", `/api/stocks/${symbol}/history?period=${period}&interval=${interval}`);
      return res.json();
    },
    enabled: Boolean(symbol)
  });
  
  const handleExport = async () => {
    try {
      // Trigger CSV download
      window.open(`/api/export/${symbol}?period=${timeframeToQuery[timeframe].period}`, '_blank');
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };
  
  const isPositive = stockData?.regularMarketChangePercent ? stockData.regularMarketChangePercent > 0 : false;
  
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            {isLoadingStock ? (
              <>
                <div className="flex items-center">
                  <Skeleton className="h-8 w-20 mr-2" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="flex items-center mt-1">
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-5 w-24 ml-3" />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center">
                  <h2 className="text-2xl font-semibold">{symbol}</h2>
                  <span className="ml-2 text-gray-500">{stockData?.shortName || stockData?.longName}</span>
                </div>
                <div className="flex items-center mt-1">
                  <p className="text-3xl font-bold">{formatNumber(stockData?.regularMarketPrice || 0)}</p>
                  <div className="ml-3 flex items-center">
                    <span className={isPositive ? "text-secondary font-medium" : "text-accent font-medium"}>
                      {isPositive ? "+" : ""}{formatNumber(stockData?.regularMarketChange || 0)} ({formatPercentage(stockData?.regularMarketChangePercent || 0)})
                    </span>
                    <i className={`${isPositive ? "ri-arrow-up-line ml-1 text-secondary" : "ri-arrow-down-line ml-1 text-accent"}`}></i>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col space-y-3">
            <div className="flex space-x-2">
              {["1D", "1W", "1M", "3M", "1Y", "5Y"].map((period) => (
                <Toggle
                  key={period}
                  pressed={timeframe === period}
                  onPressedChange={() => setTimeframe(period as TimeframeOption)}
                  className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200"
                  variant={timeframe === period ? "primary" : "default"}
                >
                  {period}
                </Toggle>
              ))}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" className="flex items-center" onClick={handleExport}>
                <i className="ri-download-line mr-1"></i> Export Data
              </Button>
            </div>
          </div>
        </div>
        
        <div className="chart-container mb-6" style={{ height: "400px" }}>
          {isLoadingHistory ? (
            <Skeleton className="h-full w-full" />
          ) : historicalData && historicalData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={historicalData.map(d => ({
                  timestamp: new Date(d.date).getTime(),
                  price: d.close,
                  date: new Date(d.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })
                }))}
                margin={{ top: 10, right: 30, left: 30, bottom: 30 }}
              >
                <defs>
                  <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0052CC" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0052CC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DFE1E6" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(tick) => {
                    if (timeframe === "1D") {
                      return new Date(tick).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });
                    } else if (timeframe === "1W" || timeframe === "1M") {
                      return new Date(tick).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      });
                    } else {
                      return new Date(tick).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      });
                    }
                  }}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#172B4D', fontSize: 12 }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#172B4D', fontSize: 12 }}
                  tickFormatter={(tick) => `$${formatNumber(tick)}`}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number) => [`$${formatNumber(value)}`, 'Price']}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #DFE1E6' }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#0052CC"
                  strokeWidth={2}
                  fill="url(#gradientBlue)"
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No data available for this timeframe</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoadingStock ? (
            Array(8).fill(0).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))
          ) : (
            <>
              <div>
                <p className="text-gray-500 text-sm">Market Cap</p>
                <p className="font-medium">{stockData?.marketCap ? `$${(stockData.marketCap / 1e12).toFixed(2)}T` : "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">P/E Ratio</p>
                <p className="font-medium">{stockData?.trailingPE ? formatNumber(stockData.trailingPE) : "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Dividend Yield</p>
                <p className="font-medium">{stockData?.dividendYield ? formatPercentage(stockData.dividendYield * 100) : "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">52-Week Range</p>
                <p className="font-medium">
                  {stockData?.fiftyTwoWeekLow && stockData?.fiftyTwoWeekHigh 
                    ? `$${formatNumber(stockData.fiftyTwoWeekLow)} - $${formatNumber(stockData.fiftyTwoWeekHigh)}`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Volume</p>
                <p className="font-medium">{stockData?.regularMarketVolume ? `${(stockData.regularMarketVolume / 1e6).toFixed(2)}M` : "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Avg Volume</p>
                <p className="font-medium">{stockData?.averageDailyVolume10Day ? `${(stockData.averageDailyVolume10Day / 1e6).toFixed(2)}M` : "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">EPS (TTM)</p>
                <p className="font-medium">{stockData?.epsTrailingTwelveMonths ? `$${formatNumber(stockData.epsTrailingTwelveMonths)}` : "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Beta</p>
                <p className="font-medium">{stockData?.beta ? formatNumber(stockData.beta) : "N/A"}</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockDetail;
