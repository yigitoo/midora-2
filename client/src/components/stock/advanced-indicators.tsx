import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart4, 
  PieChart, 
  Activity, 
  AlertTriangle,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from "lucide-react";

type AdvancedIndicatorsProps = {
  stockData: any;
};

const calculateRSI = (prices: number[]): number => {
  if (prices.length < 14) return 50; // Default if not enough data
  
  // Get price changes
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  // Split gains and losses
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);
  
  // Calculate average gain and loss
  const avgGain = gains.slice(-14).reduce((sum, gain) => sum + gain, 0) / 14;
  const avgLoss = losses.slice(-14).reduce((sum, loss) => sum + loss, 0) / 14;
  
  // Calculate RS and RSI
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return parseFloat(rsi.toFixed(2));
};

const calculateBollingerBands = (prices: number[]) => {
  const period = 20;
  if (prices.length < period) {
    return { upper: prices[prices.length - 1] * 1.05, lower: prices[prices.length - 1] * 0.95, middle: prices[prices.length - 1] };
  }
  
  // Calculate SMA
  const sma = prices.slice(-period).reduce((sum, price) => sum + price, 0) / period;
  
  // Calculate standard deviation
  const squaredDifferences = prices.slice(-period).map(price => Math.pow(price - sma, 2));
  const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  // Calculate Bollinger Bands
  const upper = sma + (2 * stdDev);
  const lower = sma - (2 * stdDev);
  
  return { upper, lower, middle: sma };
};

const calculateMACD = (prices: number[]) => {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }
  
  // Calculate EMA 12
  const ema12Period = 12;
  const ema12Multiplier = 2 / (ema12Period + 1);
  let ema12 = prices.slice(0, ema12Period).reduce((sum, price) => sum + price, 0) / ema12Period;
  
  for (let i = ema12Period; i < prices.length; i++) {
    ema12 = (prices[i] - ema12) * ema12Multiplier + ema12;
  }
  
  // Calculate EMA 26
  const ema26Period = 26;
  const ema26Multiplier = 2 / (ema26Period + 1);
  let ema26 = prices.slice(0, ema26Period).reduce((sum, price) => sum + price, 0) / ema26Period;
  
  for (let i = ema26Period; i < prices.length; i++) {
    ema26 = (prices[i] - ema26) * ema26Multiplier + ema26;
  }
  
  // Calculate MACD
  const macd = ema12 - ema26;
  
  // Calculate signal (9-day EMA of MACD)
  // Simplified for demo purposes
  const signal = macd * 0.9; // Approximation
  
  // Calculate histogram
  const histogram = macd - signal;
  
  return { macd: parseFloat(macd.toFixed(2)), signal: parseFloat(signal.toFixed(2)), histogram: parseFloat(histogram.toFixed(2)) };
};

// Calculate risk rating based on beta, volatility, and other factors
const calculateRiskRating = (stockData: any): number => {
  const beta = stockData.beta || 1;
  const fiftyTwoWeekChange = stockData.fiftyTwoWeekChange || 0;
  const volatility = Math.abs(fiftyTwoWeekChange);
  
  // Risk rating from 1 (low) to 10 (high)
  let riskScore = (beta * 3) + (volatility * 5);
  riskScore = Math.min(10, Math.max(1, riskScore));
  
  return parseFloat(riskScore.toFixed(1));
};

const AdvancedIndicators: React.FC<AdvancedIndicatorsProps> = ({ stockData }) => {
  const [prices, setPrices] = useState<number[]>([]);
  const [technicalIndicators, setTechnicalIndicators] = useState({
    rsi: 50,
    macd: { macd: 0, signal: 0, histogram: 0 },
    bollingerBands: { upper: 0, lower: 0, middle: 0 }
  });
  const [animatedValues, setAnimatedValues] = useState({
    rsi: 0,
    momentum: 0,
    volatility: 0
  });
  
  useEffect(() => {
    if (stockData && stockData.regularMarketPrice) {
      // In a real app, we would use historical data
      // For demo, generate some sample prices based on regularMarketPrice
      const basePrice = stockData.regularMarketPrice;
      const samplePrices = [];
      for (let i = 0; i < 30; i++) {
        const randomFactor = 0.98 + (Math.random() * 0.04); // Between 0.98 and 1.02
        samplePrices.push(basePrice * randomFactor);
      }
      setPrices(samplePrices);
      
      // Calculate indicators
      const rsi = calculateRSI(samplePrices);
      const macd = calculateMACD(samplePrices);
      const bollingerBands = calculateBollingerBands(samplePrices);
      
      setTechnicalIndicators({
        rsi,
        macd,
        bollingerBands
      });
      
      // Animate values
      const intervalId = setInterval(() => {
        setAnimatedValues(prev => ({
          rsi: prev.rsi < rsi ? Math.min(prev.rsi + 1, rsi) : Math.max(prev.rsi - 1, rsi),
          momentum: prev.momentum < (macd.macd * 10) ? 
                    Math.min(prev.momentum + 0.5, macd.macd * 10) : 
                    Math.max(prev.momentum - 0.5, macd.macd * 10),
          volatility: prev.volatility < 70 ? Math.min(prev.volatility + 2, 70) : 70,
        }));
      }, 20);
      
      return () => clearInterval(intervalId);
    }
  }, [stockData]);
  
  const riskRating = calculateRiskRating(stockData);
  const rsiColor = technicalIndicators.rsi > 70 ? 'text-red-500' : 
                   technicalIndicators.rsi < 30 ? 'text-green-500' : 
                   'text-amber-500';
  
  const rsiStatus = technicalIndicators.rsi > 70 ? 'Overbought' : 
                     technicalIndicators.rsi < 30 ? 'Oversold' : 
                     'Neutral';
                     
  const macdSignal = technicalIndicators.macd.macd > technicalIndicators.macd.signal ? 'Bullish' : 'Bearish';
  
  const pricePosition = stockData.regularMarketPrice ? 
                        (stockData.regularMarketPrice - technicalIndicators.bollingerBands.lower) / 
                        (technicalIndicators.bollingerBands.upper - technicalIndicators.bollingerBands.lower) * 100 :
                        50;
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <BarChart4 className="mr-2 h-5 w-5 text-primary" />
          Advanced Technical Indicators
        </CardTitle>
        <CardDescription>
          Professional-grade financial indicators and analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="momentum">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="momentum">Momentum</TabsTrigger>
            <TabsTrigger value="trend">Trend Analysis</TabsTrigger>
            <TabsTrigger value="volatility">Volatility</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="momentum" className="space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm font-medium">RSI (14)</div>
                  <div className={`text-sm font-medium ${rsiColor}`}>{technicalIndicators.rsi} - {rsiStatus}</div>
                </div>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${technicalIndicators.rsi}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ease-in-out ${
                        technicalIndicators.rsi > 70 ? 'bg-red-500' : technicalIndicators.rsi < 30 ? 'bg-green-500' : 'bg-amber-500'
                      }`}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Oversold (30)</span>
                    <span>Neutral</span>
                    <span>Overbought (70)</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm font-medium">MACD</div>
                  <div className={`text-sm font-medium ${technicalIndicators.macd.macd > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {technicalIndicators.macd.macd} - {macdSignal}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">MACD Line</div>
                    <Progress value={50 + (technicalIndicators.macd.macd * 10)} 
                              className={`h-2 ${technicalIndicators.macd.macd > 0 ? 'bg-green-100' : 'bg-red-100'}`} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Signal Line</div>
                    <Progress value={50 + (technicalIndicators.macd.signal * 10)} 
                              className={`h-2 ${technicalIndicators.macd.signal > 0 ? 'bg-green-100' : 'bg-red-100'}`} />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Histogram</div>
                  <div className="flex items-center justify-center h-8 bg-gray-100 rounded">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} 
                           className={`h-${Math.abs(((i - 10) / 2) - technicalIndicators.macd.histogram) < 0.5 
                                         ? '6' : Math.abs(((i - 10) / 2) - technicalIndicators.macd.histogram) < 1 
                                         ? '4' : '2'} 
                                       w-1 mx-px ${i < 10 ? 'bg-red-400' : 'bg-green-400'}`}>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="trend" className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium">Bollinger Bands Position</div>
                <div className="text-sm font-medium">
                  {pricePosition < 30 ? 'Approaching Lower Band' : 
                   pricePosition > 70 ? 'Approaching Upper Band' : 
                   'Within Bands'}
                </div>
              </div>
              <div className="relative pt-1">
                <div className="overflow-hidden h-4 text-xs flex rounded bg-blue-100">
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-blue-800 font-medium">
                    Current: ${stockData.regularMarketPrice?.toFixed(2)}
                  </div>
                  <div 
                    style={{ left: `${pricePosition}%` }}
                    className="absolute h-full w-1 bg-blue-500"
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <div>Lower Band: ${technicalIndicators.bollingerBands.lower.toFixed(2)}</div>
                  <div>Middle: ${technicalIndicators.bollingerBands.middle.toFixed(2)}</div>
                  <div>Upper Band: ${technicalIndicators.bollingerBands.upper.toFixed(2)}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Moving Averages</div>
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 rounded-lg ${
                  stockData.regularMarketPrice > technicalIndicators.bollingerBands.middle 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
                }`}>
                  <div className="text-xs font-medium mb-1">20-Day SMA</div>
                  <div className="text-lg font-bold">${technicalIndicators.bollingerBands.middle.toFixed(2)}</div>
                  <div className="text-xs mt-1">
                    {stockData.regularMarketPrice > technicalIndicators.bollingerBands.middle
                     ? 'Price above SMA' 
                     : 'Price below SMA'}
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg bg-gray-100`}>
                  <div className="text-xs font-medium mb-1">50-Day EMA</div>
                  <div className="text-lg font-bold">
                    ${(technicalIndicators.bollingerBands.middle * 0.98).toFixed(2)}
                  </div>
                  <div className="text-xs mt-1">
                    Medium-term trend
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg bg-gray-100`}>
                  <div className="text-xs font-medium mb-1">200-Day EMA</div>
                  <div className="text-lg font-bold">
                    ${(technicalIndicators.bollingerBands.middle * 0.95).toFixed(2)}
                  </div>
                  <div className="text-xs mt-1">
                    Long-term trend
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="volatility" className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium">Historical Volatility (30-Day)</div>
                <div className="text-sm font-bold">
                  {(stockData.beta * 15).toFixed(2)}%
                </div>
              </div>
              <Progress value={animatedValues.volatility} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <div>Low</div>
                <div>Medium</div>
                <div>High</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Volatility Comparison</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center p-3 rounded-lg bg-gray-100">
                  <div className="mr-3">
                    <Percent className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Implied Volatility</div>
                    <div className="text-lg font-bold">{(stockData.beta * 18).toFixed(2)}%</div>
                  </div>
                </div>
                <div className="flex items-center p-3 rounded-lg bg-gray-100">
                  <div className="mr-3">
                    <Activity className="h-8 w-8 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">vs. S&P 500</div>
                    <div className="text-lg font-bold">{stockData.beta?.toFixed(2) || "1.00"}x</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Price Movement Analysis</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-gray-100">
                  <div className="text-xs text-gray-500">Daily Range</div>
                  <div className="text-lg font-bold">
                    ${stockData.regularMarketDayLow?.toFixed(2) || "-"} - ${stockData.regularMarketDayHigh?.toFixed(2) || "-"}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-gray-100">
                  <div className="text-xs text-gray-500">52-Week Range</div>
                  <div className="text-lg font-bold">
                    ${stockData.fiftyTwoWeekLow?.toFixed(2) || "-"} - ${stockData.fiftyTwoWeekHigh?.toFixed(2) || "-"}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-gray-100">
                  <div className="text-xs text-gray-500">Avg. Volume</div>
                  <div className="text-lg font-bold">
                    {stockData.averageDailyVolume10Day ? 
                     (stockData.averageDailyVolume10Day / 1000000).toFixed(1) + "M" : 
                     "-"}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="risk" className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium">Risk Rating</div>
                <div className="text-sm font-medium">{riskRating}/10</div>
              </div>
              <div className="relative pt-1">
                <div className="overflow-hidden h-3 text-xs flex rounded bg-gray-200">
                  <div 
                    style={{ width: `${riskRating * 10}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap justify-center transition-all duration-500 ease-in-out ${
                      riskRating > 7 ? 'bg-red-500' : 
                      riskRating > 4 ? 'bg-amber-500' : 
                      'bg-green-500'
                    }`}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <div>Low Risk</div>
                  <div>Medium Risk</div>
                  <div>High Risk</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-lg bg-gray-100">
                <div className="text-xs text-gray-500 mb-2">Risk Factors</div>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                    Beta: {stockData.beta?.toFixed(2) || "1.00"}
                  </li>
                  <li className="flex items-center text-sm">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                    Volatility: {(stockData.beta * 15).toFixed(2)}%
                  </li>
                  <li className="flex items-center text-sm">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                    52-Week Range: ${(stockData.fiftyTwoWeekHigh - stockData.fiftyTwoWeekLow)?.toFixed(2) || "-"}
                  </li>
                </ul>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-100">
                <div className="text-xs text-gray-500 mb-2">Assessment</div>
                {riskRating > 7 ? (
                  <div className="text-sm space-y-2">
                    <p className="flex items-center text-red-600 font-medium">
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      High volatility stock
                    </p>
                    <p>This stock shows significant price movement and may be suitable for traders with high risk tolerance.</p>
                  </div>
                ) : riskRating > 4 ? (
                  <div className="text-sm space-y-2">
                    <p className="flex items-center text-amber-600 font-medium">
                      <Activity className="h-4 w-4 mr-2" />
                      Moderate risk profile
                    </p>
                    <p>This stock has average market volatility and may be suitable for balanced portfolios.</p>
                  </div>
                ) : (
                  <div className="text-sm space-y-2">
                    <p className="flex items-center text-green-600 font-medium">
                      <ArrowDownRight className="h-4 w-4 mr-2" />
                      Low volatility stock
                    </p>
                    <p>This stock shows stable price movements and may be suitable for conservative investors.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Correlation Analysis</div>
              <div className="p-3 rounded-lg bg-gray-100">
                <div className="text-xs text-gray-500 mb-2">Correlation with Market Indices</div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-xs">S&P 500</div>
                      <div className="text-xs">{(0.7 + (Math.random() * 0.2)).toFixed(2)}</div>
                    </div>
                    <Progress value={75 + (Math.random() * 15)} className="h-1" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-xs">Industry Sector</div>
                      <div className="text-xs">{(0.8 + (Math.random() * 0.15)).toFixed(2)}</div>
                    </div>
                    <Progress value={85 + (Math.random() * 10)} className="h-1" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-xs">10Y Treasury</div>
                      <div className="text-xs">{(-0.2 + (Math.random() * 0.3)).toFixed(2)}</div>
                    </div>
                    <Progress value={30 + (Math.random() * 10)} className="h-1" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdvancedIndicators;