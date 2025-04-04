import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { Play, Pause, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';

type AnimatedStockChartProps = {
  historyData: any[];
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
};

type ChartData = {
  date: string;
  price: number;
  volume?: number;
  sma?: number;
  ema?: number;
  bollUpper?: number;
  bollLower?: number;
};

// Function to calculate SMA
const calculateSMA = (data: number[], period: number): number[] => {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    sma.push(sum / period);
  }
  return sma;
};

// Function to calculate EMA
const calculateEMA = (data: number[], period: number): number[] => {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  const firstEMA = sum / period;
  ema.push(firstEMA);
  
  // Calculate EMAs after the first one
  for (let i = 1; i < data.length - period + 1; i++) {
    const currentPrice = data[i + period - 1];
    const previousEMA = ema[i - 1];
    const currentEMA = (currentPrice - previousEMA) * multiplier + previousEMA;
    ema.push(currentEMA);
  }
  
  // Pad the beginning with nulls
  const result = Array(period - 1).fill(null).concat(ema);
  return result;
};

// Function to calculate Bollinger Bands
const calculateBollingerBands = (data: number[], period: number, stdDev: number): { upper: number[], lower: number[] } => {
  const sma = calculateSMA(data, period);
  const upper = [];
  const lower = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += Math.pow(data[i - j] - sma[i], 2);
    }
    const std = Math.sqrt(sum / period);
    upper.push(sma[i] + (std * stdDev));
    lower.push(sma[i] - (std * stdDev));
  }
  
  return { upper, lower };
};

const AnimatedStockChart: React.FC<AnimatedStockChartProps> = ({
  historyData,
  symbol,
  regularMarketPrice,
  regularMarketChange,
  regularMarketChangePercent
}) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [visibleData, setVisibleData] = useState<ChartData[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeScale, setTimeScale] = useState('1d');
  const [indicators, setIndicators] = useState({
    sma: true,
    ema: false,
    bollinger: false
  });
  const [chartStyle, setChartStyle] = useState('line');
  const [hoverData, setHoverData] = useState<any>(null);
  const [gradientColors, setGradientColors] = useState({
    start: '#22c55e33',
    end: '#22c55e11'
  });
  
  const animationRef = useRef(null);
  const animationStep = 3; // Number of data points to add per frame
  
  useEffect(() => {
    if (!historyData || historyData.length === 0) return;
    
    let filteredData = historyData;
    const prices = filteredData.map(d => d.close);
    
    // Calculate indicators
    const sma20 = calculateSMA(prices, 20);
    const ema50 = calculateEMA(prices, 50);
    const bollinger = calculateBollingerBands(prices, 20, 2);
    
    const formattedData = filteredData.map((item, index) => {
      const date = new Date(item.date).toLocaleDateString();
      return {
        date,
        price: item.close,
        volume: item.volume,
        sma: sma20[index],
        ema: ema50[index],
        bollUpper: bollinger.upper[index],
        bollLower: bollinger.lower[index]
      };
    });
    
    setChartData(formattedData);
    setVisibleData([formattedData[0]]);
    
    // Set gradient colors based on price trend
    const isPositive = regularMarketChange > 0;
    setGradientColors({
      start: isPositive ? '#22c55e33' : '#ef444433',
      end: isPositive ? '#22c55e11' : '#ef444411'
    });
    
  }, [historyData, regularMarketChange]);
  
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animateChart);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, visibleData]);
  
  const animateChart = () => {
    if (visibleData.length >= chartData.length) {
      setIsPlaying(false);
      return;
    }
    
    const nextDataIndex = Math.min(visibleData.length + animationStep, chartData.length);
    setVisibleData(chartData.slice(0, nextDataIndex));
    animationRef.current = requestAnimationFrame(animateChart);
  };
  
  const handlePlayPause = () => {
    if (!isPlaying && visibleData.length >= chartData.length) {
      // Reset animation if we're at the end
      setVisibleData([chartData[0]]);
    }
    setIsPlaying(!isPlaying);
  };
  
  const resetAnimation = () => {
    setIsPlaying(false);
    setVisibleData(chartData);
  };
  
  const toggleIndicator = (indicator: 'sma' | 'ema' | 'bollinger') => {
    setIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator]
    }));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip bg-white p-2 border border-gray-200 rounded shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-primary">Price: ${Number(data.price).toFixed(2)}</p>
          {data.sma && indicators.sma && (
            <p className="text-blue-500">SMA(20): ${Number(data.sma).toFixed(2)}</p>
          )}
          {data.ema && indicators.ema && (
            <p className="text-purple-500">EMA(50): ${Number(data.ema).toFixed(2)}</p>
          )}
          {data.bollUpper && indicators.bollinger && (
            <>
              <p className="text-green-500">Upper Band: ${Number(data.bollUpper).toFixed(2)}</p>
              <p className="text-red-500">Lower Band: ${Number(data.bollLower).toFixed(2)}</p>
            </>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  // Find the lowest and highest prices for Y-axis domain
  const minPrice = visibleData.length > 0 
    ? Math.min(
        ...visibleData.map(d => d.price), 
        ...visibleData.map(d => d.bollLower || Infinity).filter(v => v !== null && isFinite(v))
      ) * 0.99  // Add some padding
    : 0;
    
  const maxPrice = visibleData.length > 0 
    ? Math.max(
        ...visibleData.map(d => d.price), 
        ...visibleData.map(d => d.bollUpper || -Infinity).filter(v => v !== null && isFinite(v))
      ) * 1.01  // Add some padding
    : 100;
    
  const isPositiveChange = regularMarketChange > 0;
  const lineColor = isPositiveChange ? "#22c55e" : "#ef4444";

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap justify-between items-center">
          <CardTitle className="text-xl">
            {symbol} Price Chart
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3"
              onClick={resetAnimation}
            >
              <Zap className="h-4 w-4 mr-1" />
              Instant
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <Button
              variant={indicators.sma ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => toggleIndicator('sma')}
            >
              SMA(20)
            </Button>
            <Button
              variant={indicators.ema ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => toggleIndicator('ema')}
            >
              EMA(50)
            </Button>
            <Button
              variant={indicators.bollinger ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => toggleIndicator('bollinger')}
            >
              Bollinger
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={chartStyle === 'line' ? "subtle" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setChartStyle('line')}
            >
              Line
            </Button>
            <Button
              variant={chartStyle === 'area' ? "subtle" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setChartStyle('area')}
            >
              Area
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex items-center">
          <div className={`text-2xl font-bold ${isPositiveChange ? 'text-green-500' : 'text-red-500'} mr-2`}>
            ${regularMarketPrice?.toFixed(2)}
          </div>
          <div className={`flex items-center text-sm ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
            {isPositiveChange ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {regularMarketChange?.toFixed(2)} ({regularMarketChangePercent?.toFixed(2)}%)
          </div>
        </div>
        
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartStyle === 'line' ? (
              <LineChart
                data={visibleData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={lineColor} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    // Simplify x-axis labels based on data length
                    if (visibleData.length > 30) {
                      return '';
                    }
                    return value;
                  }}
                />
                <YAxis 
                  domain={[minPrice, maxPrice]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {indicators.bollinger && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="bollUpper"
                      stroke="#22c55e"
                      strokeWidth={1}
                      dot={false}
                      activeDot={false}
                      strokeDasharray="3 3"
                    />
                    <Line
                      type="monotone"
                      dataKey="bollLower"
                      stroke="#ef4444"
                      strokeWidth={1}
                      dot={false}
                      activeDot={false}
                      strokeDasharray="3 3"
                    />
                  </>
                )}
                
                {indicators.sma && (
                  <Line
                    type="monotone"
                    dataKey="sma"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={false}
                  />
                )}
                
                {indicators.ema && (
                  <Line
                    type="monotone"
                    dataKey="ema"
                    stroke="#8b5cf6"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={false}
                  />
                )}
                
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </LineChart>
            ) : (
              <AreaChart
                data={visibleData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={lineColor} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    // Simplify x-axis labels based on data length
                    if (visibleData.length > 30) {
                      return '';
                    }
                    return value;
                  }}
                />
                <YAxis 
                  domain={[minPrice, maxPrice]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {indicators.bollinger && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="bollUpper"
                      stroke="#22c55e"
                      strokeWidth={1}
                      dot={false}
                      activeDot={false}
                      strokeDasharray="3 3"
                    />
                    <Line
                      type="monotone"
                      dataKey="bollLower"
                      stroke="#ef4444"
                      strokeWidth={1}
                      dot={false}
                      activeDot={false}
                      strokeDasharray="3 3"
                    />
                  </>
                )}
                
                {indicators.sma && (
                  <Line
                    type="monotone"
                    dataKey="sma"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={false}
                  />
                )}
                
                {indicators.ema && (
                  <Line
                    type="monotone"
                    dataKey="ema"
                    stroke="#8b5cf6"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={false}
                  />
                )}
                
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={lineColor}
                  strokeWidth={2}
                  fill={`url(#colorPrice)`}
                  isAnimationActive={false}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex justify-center">
          <div className="inline-flex items-center rounded-md border border-gray-200 p-1">
            <Button
              variant={timeScale === '1d' ? "subtle" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setTimeScale('1d')}
            >
              1D
            </Button>
            <Button
              variant={timeScale === '1w' ? "subtle" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setTimeScale('1w')}
            >
              1W
            </Button>
            <Button
              variant={timeScale === '1m' ? "subtle" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setTimeScale('1m')}
            >
              1M
            </Button>
            <Button
              variant={timeScale === '3m' ? "subtle" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setTimeScale('3m')}
            >
              3M
            </Button>
            <Button
              variant={timeScale === '1y' ? "subtle" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setTimeScale('1y')}
            >
              1Y
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnimatedStockChart;