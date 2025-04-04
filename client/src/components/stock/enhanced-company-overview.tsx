import React, { useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart,
  Pie, Cell, Legend, LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';
import {
  Building2, TrendingUp, TrendingDown, DollarSign, Users, Globe,
  BadgeInfo, BarChart3, PieChart as PieChartIcon, Calendar, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import NewsFeed from '../news/news-feed';

interface EnhancedCompanyOverviewProps {
  stockData: any;
  symbol: string;
  historyData?: any[];
}

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];

const EnhancedCompanyOverview: React.FC<EnhancedCompanyOverviewProps> = ({
  stockData,
  symbol,
  historyData = []
}) => {
  const [activeTab, setActiveTab] = useState('summary');

  if (!stockData) {
    return <div>Loading company information...</div>;
  }

  // Custom tooltip for financial charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-medium">{payload[0].name}: {payload[0].value}</p>
      </div>
    );
  };

  // Format large numbers for display
  const formatLargeNumber = (num?: number) => {
    if (!num) return "N/A";
    
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num}`;
  };

  // Prepare data for financial metrics chart
  const financialData = [
    { name: 'Revenue', value: stockData.totalRevenue || 0 },
    { name: 'Net Income', value: stockData.netIncomeToCommon || 0 },
    { name: 'Gross Profit', value: stockData.grossProfit || 0 },
    { name: 'Operating Income', value: stockData.operatingIncome || 0 },
    { name: 'EBITDA', value: stockData.ebitda || 0 },
  ].sort((a, b) => b.value - a.value);

  // Prepare data for valuation metrics
  const valuationData = [
    { name: 'Market Cap', value: stockData.marketCap || 0 },
    { name: 'Enterprise Value', value: stockData.enterpriseValue || 0 }
  ];

  // Prepare data for financial ratios pie chart
  const ratiosData = [
    { name: 'P/E', value: stockData.trailingPE || 0 },
    { name: 'P/S', value: stockData.priceToSalesTrailing12Months || 0 },
    { name: 'P/B', value: stockData.priceToBook || 0 },
    { name: 'EV/EBITDA', value: stockData.enterpriseToEbitda || 0 },
    { name: 'D/E', value: stockData.debtToEquity ? stockData.debtToEquity / 100 : 0 }
  ].filter(item => item.value > 0);

  // Prepare historical stock price data
  const priceHistoryData = historyData.map(item => ({
    date: new Date(item.date),
    price: item.close
  })).sort((a, b) => a.date.getTime() - b.date.getTime());

  // Industry peer comparison (mock data, would be replaced with real API data)
  const industryComparisonData = [
    { name: symbol, pe: stockData.trailingPE || 0, marketCap: stockData.marketCap || 0 },
    ...(stockData.recommendedSymbols || []).slice(0, 4).map((s: string) => ({
      name: s,
      pe: Math.random() * 50,
      marketCap: Math.random() * stockData.marketCap
    }))
  ];

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Building2 className="mr-2 h-5 w-5 text-primary" />
                {stockData.shortName || stockData.longName || symbol}
              </CardTitle>
              <CardDescription className="mt-1 flex items-center">
                <Globe className="mr-1 h-4 w-4 text-muted-foreground" />
                {stockData.industry} • {stockData.sector}
              </CardDescription>
            </div>
            
            {stockData.website && (
              <Button variant="outline" size="sm" className="ml-auto" asChild>
                <a href={stockData.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="mr-2 h-4 w-4" />
                  Website
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="summary">
                <BadgeInfo className="mr-2 h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="financials">
                <BarChart3 className="mr-2 h-4 w-4" />
                Financials
              </TabsTrigger>
              <TabsTrigger value="news">
                <Calendar className="mr-2 h-4 w-4" />
                News
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="space-y-4">
              {/* Company Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">About the Company</h3>
                <p className="text-muted-foreground">
                  {stockData.longBusinessSummary || `${stockData.shortName || symbol} is a publicly traded company.`}
                </p>
              </div>
              
              <Separator />
              
              {/* Key Statistics */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Key Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Market Cap</p>
                    <p className="font-medium">{formatLargeNumber(stockData.marketCap)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">P/E Ratio</p>
                    <p className="font-medium">{stockData.trailingPE ? stockData.trailingPE.toFixed(2) : 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Beta (5Y)</p>
                    <p className="font-medium">{stockData.beta ? stockData.beta.toFixed(2) : 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">52-Week Range</p>
                    <p className="font-medium">
                      ${stockData.fiftyTwoWeekLow?.toFixed(2) || 'N/A'} - ${stockData.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">EPS (TTM)</p>
                    <p className="font-medium">${stockData.epsTrailingTwelveMonths?.toFixed(2) || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Shares Outstanding</p>
                    <p className="font-medium">{stockData.sharesOutstanding ? (stockData.sharesOutstanding / 1e6).toFixed(2) + 'M' : 'N/A'}</p>
                  </div>
                  
                  {stockData.dividendYield && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Dividend Yield</p>
                      <p className="font-medium">{(stockData.dividendYield * 100).toFixed(2)}%</p>
                    </div>
                  )}
                  
                  {stockData.exDividendDate && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Ex-Dividend Date</p>
                      <p className="font-medium">{format(new Date(stockData.exDividendDate * 1000), 'MMM dd, yyyy')}</p>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Employees</p>
                    <p className="font-medium">{stockData.fullTimeEmployees?.toLocaleString() || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Historical Price Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Historical Performance</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceHistoryData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(date) => format(new Date(date), 'MMM yyyy')}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                      />
                      <Tooltip 
                        labelFormatter={(label) => format(new Date(label), 'MMMM dd, yyyy')}
                        formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="var(--color-primary)" 
                        fill="var(--color-primary-light)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Peer Comparison */}
              {stockData.recommendedSymbols && stockData.recommendedSymbols.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Industry Comparison</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={industryComparisonData} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12, angle: -45, textAnchor: 'end' }}
                          />
                          <YAxis 
                            yAxisId="left"
                            orientation="left"
                            tick={{ fontSize: 12 }}
                            label={{ value: 'P/E Ratio', angle: -90, position: 'insideLeft' }}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `${(value / 1e9).toFixed(0)}B`}
                            label={{ value: 'Market Cap (B)', angle: 90, position: 'insideRight' }}
                          />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            dataKey="pe" 
                            fill="#0088FE" 
                            name="P/E Ratio" 
                            yAxisId="left"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="marketCap" 
                            fill="#00C49F" 
                            name="Market Cap" 
                            yAxisId="right"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="financials" className="space-y-4">
              {/* Financial Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Financial Overview</h3>
                <p className="text-muted-foreground mb-4">
                  Key financial metrics for {stockData.shortName || symbol}. Data is from the most recent fiscal year.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Financial Metrics Bars */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Key Financial Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={financialData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                            <XAxis 
                              type="number"
                              tickFormatter={(value) => `${(value / 1e9).toFixed(0)}B`}
                            />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                            <Tooltip 
                              formatter={(value: any) => [`$${(value / 1e9).toFixed(2)}B`, '']}
                            />
                            <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Financial Ratios */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Financial Ratios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={ratiosData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value.toFixed(2)}`}
                            >
                              {ratiosData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <Separator />
              
              {/* Detailed Metrics */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Detailed Financial Metrics</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Revenue (TTM)</p>
                    <p className="font-medium">{formatLargeNumber(stockData.totalRevenue)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Revenue Growth (YoY)</p>
                    <p className="font-medium">{stockData.revenueGrowth ? `${(stockData.revenueGrowth * 100).toFixed(2)}%` : 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Gross Margin</p>
                    <p className="font-medium">{stockData.grossMargins ? `${(stockData.grossMargins * 100).toFixed(2)}%` : 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Operating Margin</p>
                    <p className="font-medium">{stockData.operatingMargins ? `${(stockData.operatingMargins * 100).toFixed(2)}%` : 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Net Income (TTM)</p>
                    <p className="font-medium">{formatLargeNumber(stockData.netIncomeToCommon)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Profit Margin</p>
                    <p className="font-medium">{stockData.profitMargins ? `${(stockData.profitMargins * 100).toFixed(2)}%` : 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">EBITDA</p>
                    <p className="font-medium">{formatLargeNumber(stockData.ebitda)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Return on Equity</p>
                    <p className="font-medium">{stockData.returnOnEquity ? `${(stockData.returnOnEquity * 100).toFixed(2)}%` : 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Debt</p>
                    <p className="font-medium">{formatLargeNumber(stockData.totalDebt)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Debt to Equity</p>
                    <p className="font-medium">{stockData.debtToEquity ? `${(stockData.debtToEquity / 100).toFixed(2)}` : 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current Ratio</p>
                    <p className="font-medium">{stockData.currentRatio ? stockData.currentRatio.toFixed(2) : 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Quick Ratio</p>
                    <p className="font-medium">{stockData.quickRatio ? stockData.quickRatio.toFixed(2) : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="news">
              <NewsFeed stockSymbol={symbol} limit={5} />
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="text-xs text-muted-foreground">
          Data as of {format(new Date(), 'MMMM dd, yyyy')}. Financial data may be delayed.
        </CardFooter>
      </Card>
    </div>
  );
};

export default EnhancedCompanyOverview;