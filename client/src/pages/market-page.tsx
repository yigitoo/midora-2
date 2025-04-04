import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketIndex, StockQuote } from "@/types/stock";
import { apiRequest } from "@/lib/queryClient";
import { formatNumber, formatPercentage } from "@/lib/utils";

const MarketPage = () => {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("us");
  
  // Fetch market indices
  const { data: indices, isLoading: isLoadingIndices } = useQuery<MarketIndex[]>({
    queryKey: ["/api/market/indices"],
  });
  
  // Fetch top gainers
  const { data: topGainers, isLoading: isLoadingGainers } = useQuery<StockQuote[]>({
    queryKey: ["/api/market/gainers"],
  });
  
  // Fetch top losers
  const { data: topLosers, isLoading: isLoadingLosers } = useQuery<StockQuote[]>({
    queryKey: ["/api/market/losers"],
  });
  
  // Fetch most active
  const { data: mostActive, isLoading: isLoadingActive } = useQuery<StockQuote[]>({
    queryKey: ["/api/market/active"],
  });
  
  const handleViewStock = (symbol: string) => {
    window.location.href = `/?symbol=${symbol}`;
  };
  
  // Filter indices by market
  const getFilteredIndices = () => {
    if (!indices) return [];
    
    switch (activeTab) {
      case "us":
        return indices.filter(index => ["^DJI", "^GSPC", "^IXIC", "^RUT"].includes(index.symbol));
      case "global":
        return indices.filter(index => ["^FTSE", "^GDAXI", "^FCHI", "^N225", "^HSI"].includes(index.symbol));
      case "crypto":
        return indices.filter(index => ["BTC-USD", "ETH-USD", "XRP-USD", "ADA-USD"].includes(index.symbol));
      default:
        return indices;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-textDark">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Market Overview</h1>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Back to Dashboard
          </Button>
        </div>
        
        {/* Market Indices */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Market Indices</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="us">US Markets</TabsTrigger>
                <TabsTrigger value="global">Global Markets</TabsTrigger>
                <TabsTrigger value="crypto">Crypto</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="space-y-4">
                {isLoadingIndices ? (
                  <div className="py-8 text-center text-gray-500">Loading market data...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {getFilteredIndices().map((index, idx) => {
                      const isPositive = index.change >= 0;
                      return (
                        <Card key={idx} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex flex-col">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold">{index.name}</h3>
                                  <p className="text-sm text-gray-500">{index.symbol}</p>
                                </div>
                                <div className={`text-right ${isPositive ? 'text-secondary' : 'text-accent'}`}>
                                  <p className="font-medium">{formatNumber(index.price)}</p>
                                  <p className="text-sm">
                                    {isPositive ? '+' : ''}{formatNumber(index.change)} ({isPositive ? '+' : ''}{formatPercentage(index.changePercent)})
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Market Movers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Gainers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Top Gainers</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingGainers ? (
                <div className="py-4 text-center text-gray-500">Loading...</div>
              ) : topGainers && topGainers.length > 0 ? (
                <div className="space-y-3">
                  {topGainers.slice(0, 5).map((stock, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center p-2 hover:bg-hoverBg rounded-md cursor-pointer"
                      onClick={() => handleViewStock(stock.symbol)}
                    >
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-xs text-gray-500">{stock.shortName || stock.longName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(stock.regularMarketPrice || 0)}</p>
                        <p className="text-secondary text-sm">
                          +{formatPercentage(stock.regularMarketChangePercent || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">No data available</div>
              )}
            </CardContent>
          </Card>
          
          {/* Top Losers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Top Losers</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLosers ? (
                <div className="py-4 text-center text-gray-500">Loading...</div>
              ) : topLosers && topLosers.length > 0 ? (
                <div className="space-y-3">
                  {topLosers.slice(0, 5).map((stock, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center p-2 hover:bg-hoverBg rounded-md cursor-pointer"
                      onClick={() => handleViewStock(stock.symbol)}
                    >
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-xs text-gray-500">{stock.shortName || stock.longName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(stock.regularMarketPrice || 0)}</p>
                        <p className="text-accent text-sm">
                          {formatPercentage(stock.regularMarketChangePercent || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">No data available</div>
              )}
            </CardContent>
          </Card>
          
          {/* Most Active */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Most Active</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingActive ? (
                <div className="py-4 text-center text-gray-500">Loading...</div>
              ) : mostActive && mostActive.length > 0 ? (
                <div className="space-y-3">
                  {mostActive.slice(0, 5).map((stock, index) => {
                    const isPositive = (stock.regularMarketChangePercent || 0) > 0;
                    return (
                      <div 
                        key={index} 
                        className="flex justify-between items-center p-2 hover:bg-hoverBg rounded-md cursor-pointer"
                        onClick={() => handleViewStock(stock.symbol)}
                      >
                        <div>
                          <p className="font-medium">{stock.symbol}</p>
                          <p className="text-xs text-gray-500">{stock.shortName || stock.longName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatNumber(stock.regularMarketPrice || 0)}</p>
                          <p className={`text-sm ${isPositive ? 'text-secondary' : 'text-accent'}`}>
                            {isPositive ? '+' : ''}{formatPercentage(stock.regularMarketChangePercent || 0)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MarketPage;