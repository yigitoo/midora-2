import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import MarketOverview from "@/components/dashboard/market-overview";
import StockDetail from "@/components/dashboard/stock-detail";
import RecentActivity from "@/components/dashboard/recent-activity";
import Watchlist from "@/components/dashboard/watchlist";
import { LiveStockTicker } from "@/components/stock/live-stock-ticker";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [selectedStock, setSelectedStock] = useState<string>("AAPL");

  // Extract symbol from URL if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const symbolParam = urlParams.get("symbol");
    if (symbolParam) {
      setSelectedStock(symbolParam);
    }
  }, [location]);
  
  // Get user's default watchlist
  const { data: watchlists } = useQuery({
    queryKey: ["/api/watchlists"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/watchlists");
      return await res.json();
    }
  });
  
  const defaultWatchlistId = watchlists && watchlists.length > 0 ? watchlists[0].id : 1;
  
  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async (symbol: string) => {
      await apiRequest("POST", `/api/watchlists/${defaultWatchlistId}/items`, { symbol });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/watchlists/${defaultWatchlistId}`] });
      toast({
        title: "Stock added to watchlist",
        description: `${selectedStock} has been added to your watchlist`
      });
    },
    onError: (error: any) => {
      // Check if it's because the stock is already in the watchlist
      if (error.message.includes("already exists")) {
        toast({
          title: "Already in watchlist",
          description: `${selectedStock} is already in your watchlist`
        });
      } else {
        toast({
          title: "Failed to add to watchlist",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  });
  
  const handleAddToWatchlist = () => {
    addToWatchlistMutation.mutate(selectedStock);
  };
  
  const handleStockSelected = (symbol: string) => {
    setSelectedStock(symbol);
  };
  
  const handleExportData = async () => {
    try {
      window.open(`/api/export/${selectedStock}`, '_blank');
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-textDark">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Market Dashboard</h1>
            <p className="text-gray-500">Welcome back, {user?.firstName || user?.username}</p>
          </div>
          
          <div className="flex space-x-3 mt-4 md:mt-0">
            <Button 
              onClick={handleAddToWatchlist}
              disabled={addToWatchlistMutation.isPending}
              className="flex items-center"
            >
              {addToWatchlistMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <i className="ri-add-line mr-1"></i>
              )}
              Add to Watchlist
            </Button>
            
            <Button variant="outline" className="flex items-center" onClick={handleExportData}>
              <i className="ri-download-line mr-1"></i> Export Data
            </Button>
          </div>
        </div>
        
        {/* Market Overview Cards */}
        <MarketOverview />
        
        {/* Stock Detail */}
        <StockDetail symbol={selectedStock} />
        
        {/* Recent Activity, Live Ticker & Watchlist */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <RecentActivity />
            <LiveStockTicker 
              symbols={["AAPL", "MSFT", "GOOGL", "AMZN", "META"]}
              title="Live Updates"
              onSelectStock={handleStockSelected}
            />
          </div>
          
          <div className="md:col-span-2">
            <Watchlist watchlistId={defaultWatchlistId} onSelectStock={handleStockSelected} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
