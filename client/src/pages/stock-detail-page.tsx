import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AnimatedStockChart from "@/components/stock/animated-stock-chart";
import AdvancedIndicators from "@/components/stock/advanced-indicators";
import EnhancedStockChart from "@/components/stock/enhanced-stock-chart";
import EnhancedCompanyOverview from "@/components/stock/enhanced-company-overview";
import NewsFeed from "@/components/news/news-feed";
import { ArrowLeft, Bookmark, PlusCircle, LineChart, Eye, Download, Clock, TrendingUp, TrendingDown, Info } from "lucide-react";

const StockDetailPage = () => {
  const [location, navigate] = useLocation();
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol.toUpperCase();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch stock data
  const { data: stockData, isLoading: isLoadingStock, error: stockError } = useQuery({
    queryKey: [`/api/stocks/${symbol}`],
  });
  
  // Fetch historical data for chart
  const { data: historyData, isLoading: isLoadingHistory, error: historyError } = useQuery({
    queryKey: [`/api/stocks/${symbol}/history`],
  });
  
  // Handle adding to watchlist
  const handleAddToWatchlist = async () => {
    try {
      await apiRequest("POST", "/api/watchlists/1/items", { symbol });
      toast({
        title: "Added to watchlist",
        description: `${symbol} has been added to your watchlist`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add to watchlist",
        variant: "destructive"
      });
    }
  };
  
  // Export data as CSV
  const handleExportData = async () => {
    try {
      window.open(`/api/export/${symbol}`, '_blank');
      toast({
        title: "Export started",
        description: "The data export has started. Check your downloads."
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export stock data",
        variant: "destructive"
      });
    }
  };
  
  if (stockError || historyError) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate("/")} className="mr-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold">Stock Not Found</h1>
          </div>
          
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Stock symbol not found</h3>
                <p className="text-gray-500 mb-4">The stock symbol "{symbol}" could not be found or there was an error loading its data.</p>
                <Button onClick={() => navigate("/")}>
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  // Format price change display
  const formatPriceChange = (change?: number, changePercent?: number) => {
    if (change === undefined || changePercent === undefined) return null;
    
    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    const color = isPositive ? 'text-green-500' : 'text-red-500';
    
    return (
      <div className={`flex items-center ${color}`}>
        {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        <span>{sign}{change.toFixed(2)} ({sign}{changePercent.toFixed(2)}%)</span>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate("/")} className="mr-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold">
              {stockData?.shortName || symbol}
              {stockData?.symbol && <span className="text-lg font-normal text-gray-500 ml-2">({stockData.symbol})</span>}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" onClick={handleAddToWatchlist}>
              <Bookmark className="w-4 h-4 mr-2" />
              Add to Watchlist
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
        
        {isLoadingStock || isLoadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="md:col-span-2 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl">${stockData?.regularMarketPrice?.toFixed(2)}</CardTitle>
                      {formatPriceChange(stockData?.regularMarketChange, stockData?.regularMarketChangePercent)}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Market {stockData?.marketState}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <AnimatedStockChart 
                    historyData={historyData} 
                    symbol={symbol}
                    regularMarketPrice={stockData?.regularMarketPrice}
                    regularMarketChange={stockData?.regularMarketChange}
                    regularMarketChangePercent={stockData?.regularMarketChangePercent}
                  />
                </CardContent>
              </Card>
              
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Key Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Open</span>
                      <span className="font-medium">${stockData?.regularMarketOpen?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Previous Close</span>
                      <span className="font-medium">${stockData?.regularMarketPreviousClose?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Day Range</span>
                      <span className="font-medium">${stockData?.regularMarketDayLow?.toFixed(2)} - ${stockData?.regularMarketDayHigh?.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-gray-500">52 Week Range</span>
                      <span className="font-medium">${stockData?.fiftyTwoWeekLow?.toFixed(2)} - ${stockData?.fiftyTwoWeekHigh?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Volume</span>
                      <span className="font-medium">{stockData?.regularMarketVolume?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg. Volume</span>
                      <span className="font-medium">{stockData?.averageDailyVolume10Day?.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-gray-500">Market Cap</span>
                      <span className="font-medium">
                        {stockData?.marketCap 
                          ? (stockData.marketCap >= 1e12 
                            ? `$${(stockData.marketCap / 1e12).toFixed(2)}T` 
                            : `$${(stockData.marketCap / 1e9).toFixed(2)}B`)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">P/E Ratio</span>
                      <span className="font-medium">{stockData?.trailingPE?.toFixed(2) || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">EPS</span>
                      <span className="font-medium">${stockData?.epsTrailingTwelveMonths?.toFixed(2) || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Beta</span>
                      <span className="font-medium">{stockData?.beta?.toFixed(2) || "N/A"}</span>
                    </div>
                    {stockData?.dividendYield && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dividend Yield</span>
                        <span className="font-medium">{(stockData.dividendYield * 100).toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="overview" className="flex items-center">
                  <LineChart className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="indicators" className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Advanced Indicators
                </TabsTrigger>
                <TabsTrigger value="news" className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  News & Updates
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <EnhancedCompanyOverview 
                  stockData={stockData} 
                  symbol={symbol}
                  historyData={historyData}
                />
              </TabsContent>
              
              <TabsContent value="indicators">
                <AdvancedIndicators stockData={stockData} />
              </TabsContent>
              
              <TabsContent value="news">
                <NewsFeed stockSymbol={symbol} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default StockDetailPage;