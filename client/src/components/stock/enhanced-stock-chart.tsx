import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, AreaChart, Area, Brush, BarChart, Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp, TrendingDown, Calendar, Activity, BarChart as BarChartIcon,
  ZoomIn, ZoomOut, Download, MoreHorizontal, Info
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';

interface EnhancedStockChartProps {
  historyData: any[];
  symbol: string;
  chartAnnotations?: {
    date: string;
    type: 'earnings' | 'dividend' | 'split' | 'news' | 'upgrade' | 'downgrade';
    detail: string;
  }[];
}

// Color scheme that respects the dark/light mode
const chartColors = {
  price: 'var(--color-primary)',
  volume: 'rgba(100, 116, 139, 0.5)',
  grid: 'rgba(148, 163, 184, 0.2)',
  tooltip: 'var(--color-card)',
  gain: 'rgb(34, 197, 94)',
  loss: 'rgb(239, 68, 68)',
  earnings: '#8b5cf6',
  dividend: '#06b6d4',
  split: '#f59e0b',
  news: '#a3e635',
  upgrade: '#10b981',
  downgrade: '#ef4444'
};

const EnhancedStockChart: React.FC<EnhancedStockChartProps> = ({ historyData, symbol, chartAnnotations = [] }) => {
  const [range, setRange] = useState('1m');
  const [chartType, setChartType] = useState('line');
  const [chartData, setChartData] = useState<any[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [maxVolume, setMaxVolume] = useState<number>(0);
  const [hoverData, setHoverData] = useState<any>(null);
  const [annotations, setAnnotations] = useState<any[]>(chartAnnotations);

  // When data loads or range changes, process the data
  useEffect(() => {
    if (!historyData || !historyData.length) return;

    // Convert to array if it's not already
    const dataArray = Array.isArray(historyData) ? historyData : [historyData];
    
    // Map data and format dates
    const processedData = dataArray.map(item => ({
      ...item,
      date: new Date(item.date),
      formattedDate: format(new Date(item.date), 'MMM dd, yyyy')
    }));
    
    // Filter based on selected range
    let filteredData = processedData;
    const now = new Date();
    
    switch (range) {
      case '1d':
        // For intraday data - would need separate API for this
        break;
      case '1w':
        filteredData = processedData.filter(item => 
          new Date(item.date) >= new Date(now.setDate(now.getDate() - 7))
        );
        break;
      case '1m':
        filteredData = processedData.filter(item => 
          new Date(item.date) >= new Date(now.setMonth(now.getMonth() - 1))
        );
        break;
      case '3m':
        filteredData = processedData.filter(item => 
          new Date(item.date) >= new Date(now.setMonth(now.getMonth() - 3))
        );
        break;
      case '6m':
        filteredData = processedData.filter(item => 
          new Date(item.date) >= new Date(now.setMonth(now.getMonth() - 6))
        );
        break;
      case '1y':
        filteredData = processedData.filter(item => 
          new Date(item.date) >= new Date(now.setFullYear(now.getFullYear() - 1))
        );
        break;
      case '5y':
        filteredData = processedData.filter(item => 
          new Date(item.date) >= new Date(now.setFullYear(now.getFullYear() - 5))
        );
        break;
      case 'all':
        // Already have all data
        break;
    }
    
    // Sort by date, oldest to newest
    filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate min/max values for axis scaling
    const prices = filteredData.map(d => d.close);
    setMinPrice(Math.min(...prices) * 0.99); // Add small buffer
    setMaxPrice(Math.max(...prices) * 1.01); // Add small buffer
    
    const volumes = filteredData.map(d => d.volume);
    setMaxVolume(Math.max(...volumes) * 1.1); // Add buffer
    
    setChartData(filteredData);
  }, [historyData, range]);

  // Custom tooltip component for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    setHoverData(data);
    
    return (
      <div className="custom-tooltip p-3 rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-sm">{format(new Date(data.date), 'MMMM dd, yyyy')}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
          <span className="text-gray-500">Open</span>
          <span className="font-medium text-right">${data.open.toFixed(2)}</span>
          
          <span className="text-gray-500">High</span>
          <span className="font-medium text-right">${data.high.toFixed(2)}</span>
          
          <span className="text-gray-500">Low</span>
          <span className="font-medium text-right">${data.low.toFixed(2)}</span>
          
          <span className="text-gray-500">Close</span>
          <span className="font-medium text-right">${data.close.toFixed(2)}</span>
          
          <span className="text-gray-500">Volume</span>
          <span className="font-medium text-right">{data.volume.toLocaleString()}</span>
        </div>
      </div>
    );
  };
  
  // Custom dot for annotations
  const CustomizedDot = ({ cx, cy, payload }: any) => {
    // Check if this data point has an annotation
    const annotation = annotations.find(a => 
      format(new Date(a.date), 'yyyy-MM-dd') === format(new Date(payload.date), 'yyyy-MM-dd')
    );
    
    if (!annotation) return null;
    
    const colors: {[key: string]: string} = {
      earnings: chartColors.earnings,
      dividend: chartColors.dividend,
      split: chartColors.split,
      news: chartColors.news,
      upgrade: chartColors.upgrade,
      downgrade: chartColors.downgrade
    };
    
    const color = colors[annotation.type];
    
    return (
      <svg x={cx - 7} y={cy - 7} width={14} height={14} viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" fill={color} stroke="white" strokeWidth="1" />
        <circle cx="7" cy="7" r="3" fill="white" />
      </svg>
    );
  };
  
  // Render annotation reference lines
  const renderAnnotationLines = () => {
    if (!annotations || !annotations.length) return null;
    
    return annotations.map((annotation, index) => {
      const date = new Date(annotation.date);
      
      return (
        <ReferenceLine 
          key={`annotation-${index}`}
          x={date.getTime()}
          stroke={chartColors[annotation.type]}
          strokeDasharray="3 3"
          strokeWidth={1}
        />
      );
    });
  };
  
  // Handle export data as CSV
  const handleExportCSV = () => {
    if (!chartData || !chartData.length) return;
    
    const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'];
    const csvData = chartData.map(d => 
      [
        format(new Date(d.date), 'yyyy-MM-dd'),
        d.open,
        d.high,
        d.low,
        d.close,
        d.volume
      ].join(',')
    );
    
    const csv = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${symbol}_${range}_data.csv`);
    a.click();
  };
  
  // Calculate price change
  const priceChange = useMemo(() => {
    if (!chartData || chartData.length < 2) return { value: 0, percent: 0 };
    
    const firstPrice = chartData[0].close;
    const lastPrice = chartData[chartData.length - 1].close;
    const change = lastPrice - firstPrice;
    const percentChange = (change / firstPrice) * 100;
    
    return {
      value: change,
      percent: percentChange
    };
  }, [chartData]);
  
  // Determine color based on price change
  const priceChangeColor = priceChange.value >= 0 ? 'text-green-500' : 'text-red-500';
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            {symbol} Price Chart
            <TooltipProvider>
              <TooltipUI>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="max-w-xs text-xs">
                    Interactive chart showing historical price data. 
                    Hover over the chart to see detailed information for each data point.
                  </p>
                </TooltipContent>
              </TooltipUI>
            </TooltipProvider>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <div className={`flex items-center ${priceChangeColor}`}>
              {priceChange.value >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              <span className="text-sm font-medium">
                {priceChange.value >= 0 ? '+' : ''}
                {priceChange.value.toFixed(2)} ({priceChange.value >= 0 ? '+' : ''}
                {priceChange.percent.toFixed(2)}%)
              </span>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-36 p-1">
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs mb-1" onClick={handleExportCSV}>
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Export CSV
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="flex justify-between mt-4">
          <div className="flex space-x-1">
            {['1d', '1w', '1m', '3m', '6m', '1y', '5y', 'all'].map((r) => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? "default" : "ghost"}
                className="text-xs h-7 px-2"
                onClick={() => setRange(r)}
              >
                {r}
              </Button>
            ))}
          </div>
          
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant={chartType === 'line' ? "default" : "ghost"}
              className="text-xs h-7 px-2"
              onClick={() => setChartType('line')}
            >
              <Activity className="h-3.5 w-3.5 mr-1" />
              Line
            </Button>
            <Button
              size="sm"
              variant={chartType === 'area' ? "default" : "ghost"}
              className="text-xs h-7 px-2"
              onClick={() => setChartType('area')}
            >
              <TrendingUp className="h-3.5 w-3.5 mr-1" />
              Area
            </Button>
            <Button
              size="sm"
              variant={chartType === 'candle' ? "default" : "ghost"}
              className="text-xs h-7 px-2"
              onClick={() => setChartType('candle')}
            >
              <BarChartIcon className="h-3.5 w-3.5 mr-1" />
              OHLC
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[400px] w-full">
          {chartType === 'line' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'MM/dd')}
                  stroke="var(--color-foreground)"
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  domain={[minPrice, maxPrice]}
                  stroke="var(--color-foreground)"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke={chartColors.price} 
                  strokeWidth={2}
                  activeDot={{ r: 5, stroke: 'var(--color-primary)', strokeWidth: 1, fill: 'white' }}
                  dot={<CustomizedDot />} 
                />
                {renderAnnotationLines()}
              </LineChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 'area' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'MM/dd')}
                  stroke="var(--color-foreground)"
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  domain={[minPrice, maxPrice]}
                  stroke="var(--color-foreground)"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke={chartColors.price} 
                  fill={`${chartColors.price}30`}
                  strokeWidth={2}
                  activeDot={{ r: 5, stroke: 'var(--color-primary)', strokeWidth: 1, fill: 'white' }}
                  dot={<CustomizedDot />} 
                />
                {renderAnnotationLines()}
              </AreaChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 'candle' && (
            <div className="grid grid-rows-3 h-full gap-2">
              <div className="row-span-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={8} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), 'MM/dd')}
                      stroke="var(--color-foreground)"
                      tick={{ fontSize: 10 }}
                      hide={true}
                    />
                    <YAxis 
                      domain={[minPrice, maxPrice]}
                      stroke="var(--color-foreground)"
                      tick={{ fontSize: 10 }}
                      orientation="right"
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                      yAxisId="price"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="low" 
                      fill="transparent" 
                      yAxisId="price" 
                    />
                    <Bar 
                      dataKey="high" 
                      fill="transparent" 
                      yAxisId="price" 
                    />
                    <Bar 
                      dataKey={(data) => data.close > data.open ? data.close - data.open : 0} 
                      stackId="ohlc" 
                      fill={chartColors.gain} 
                      yAxisId="price" 
                    />
                    <Bar 
                      dataKey={(data) => data.close <= data.open ? data.close - data.open : 0} 
                      stackId="ohlc" 
                      fill={chartColors.loss} 
                      yAxisId="price" 
                    />
                    <Bar 
                      dataKey={(data) => data.open} 
                      stackId="ohlc" 
                      fill="transparent" 
                      yAxisId="price" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="row-span-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={5} margin={{ top: 0, right: 20, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), 'MM/dd')}
                      stroke="var(--color-foreground)"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      domain={[0, maxVolume]}
                      stroke="var(--color-foreground)"
                      tick={{ fontSize: 10 }}
                      orientation="right"
                      tickFormatter={(value) => {
                        if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
                        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                        if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
                        return value.toString();
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="volume" 
                      fill={chartColors.volume} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
        
        {hoverData && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-background rounded-lg p-3 border border-border">
              <div className="text-xs text-muted-foreground">Open</div>
              <div className="text-lg font-semibold">${hoverData.open.toFixed(2)}</div>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border">
              <div className="text-xs text-muted-foreground">High</div>
              <div className="text-lg font-semibold">${hoverData.high.toFixed(2)}</div>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border">
              <div className="text-xs text-muted-foreground">Low</div>
              <div className="text-lg font-semibold">${hoverData.low.toFixed(2)}</div>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border">
              <div className="text-xs text-muted-foreground">Close</div>
              <div className="text-lg font-semibold">${hoverData.close.toFixed(2)}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedStockChart;