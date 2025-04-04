import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Watchlist as WatchlistType } from "@shared/schema";
import { StockQuote } from "@/types/stock";
import { formatNumber, formatPercentage } from "@/lib/utils";

interface WatchlistWithStocks extends WatchlistType {
  items: { id: number; symbol: string; watchlistId: number }[];
  stockData: StockQuote[];
}

const WatchlistPage = () => {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeWatchlist, setActiveWatchlist] = useState<number | null>(null);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newSymbol, setNewSymbol] = useState("");
  
  // Get all user watchlists
  const { data: watchlists, isLoading: isLoadingWatchlists } = useQuery<WatchlistType[]>({
    queryKey: ["/api/watchlists"]
  });
  
  // Set active watchlist when data is loaded
  useEffect(() => {
    if (watchlists && watchlists.length > 0 && !activeWatchlist) {
      setActiveWatchlist(watchlists[0].id);
    }
  }, [watchlists, activeWatchlist]);
  
  // Get watchlist details with stock data
  const { data: watchlistDetails, isLoading: isLoadingDetails } = useQuery<WatchlistWithStocks>({
    queryKey: [`/api/watchlists/${activeWatchlist}`],
    enabled: !!activeWatchlist,
  });
  
  // Create watchlist mutation
  const createWatchlistMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/watchlists", { name });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      setNewWatchlistName("");
      toast({
        title: "Watchlist created",
        description: "Your new watchlist has been created successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create watchlist",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async (symbol: string) => {
      if (!activeWatchlist) throw new Error("No watchlist selected");
      const res = await apiRequest("POST", `/api/watchlists/${activeWatchlist}/items`, { symbol });
      return await res.json();
    },
    onSuccess: () => {
      if (activeWatchlist) {
        queryClient.invalidateQueries({ queryKey: [`/api/watchlists/${activeWatchlist}`] });
      }
      setNewSymbol("");
      toast({
        title: "Stock added",
        description: "Stock has been added to your watchlist"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add stock",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Remove from watchlist mutation
  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (symbol: string) => {
      if (!activeWatchlist) throw new Error("No watchlist selected");
      await apiRequest("DELETE", `/api/watchlists/${activeWatchlist}/items/${symbol}`);
    },
    onSuccess: () => {
      if (activeWatchlist) {
        queryClient.invalidateQueries({ queryKey: [`/api/watchlists/${activeWatchlist}`] });
      }
      toast({
        title: "Stock removed",
        description: "Stock has been removed from your watchlist"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove stock",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete watchlist mutation
  const deleteWatchlistMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/watchlists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      if (watchlists && watchlists.length > 0) {
        // Set active to next available watchlist
        const nextWatchlist = watchlists.find(w => w.id !== activeWatchlist);
        setActiveWatchlist(nextWatchlist ? nextWatchlist.id : null);
      } else {
        setActiveWatchlist(null);
      }
      toast({
        title: "Watchlist deleted",
        description: "Your watchlist has been deleted"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete watchlist",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleCreateWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) {
      toast({
        title: "Watchlist name required",
        description: "Please enter a name for your watchlist",
        variant: "destructive"
      });
      return;
    }
    createWatchlistMutation.mutate(newWatchlistName);
  };
  
  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) {
      toast({
        title: "Symbol required",
        description: "Please enter a stock symbol",
        variant: "destructive"
      });
      return;
    }
    addToWatchlistMutation.mutate(newSymbol.toUpperCase());
  };
  
  const handleRemoveSymbol = (symbol: string) => {
    removeFromWatchlistMutation.mutate(symbol);
  };
  
  const handleDeleteWatchlist = () => {
    if (!activeWatchlist) return;
    
    if (confirm("Are you sure you want to delete this watchlist?")) {
      deleteWatchlistMutation.mutate(activeWatchlist);
    }
  };
  
  const navigateToStock = useCallback((symbol: string) => {
    navigate(`/stocks/${symbol}`);
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-textDark">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Your Watchlists</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar - Watchlist management */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Manage Watchlists</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Create new watchlist */}
                <form onSubmit={handleCreateWatchlist} className="mb-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="New watchlist name"
                      value={newWatchlistName}
                      onChange={(e) => setNewWatchlistName(e.target.value)}
                    />
                    <Button 
                      type="submit"
                      size="sm"
                      disabled={createWatchlistMutation.isPending}
                    >
                      <i className="ri-add-line"></i>
                    </Button>
                  </div>
                </form>
                
                {/* Watchlist list */}
                <div className="space-y-2">
                  {isLoadingWatchlists ? (
                    <div className="py-4 text-center text-gray-500">Loading...</div>
                  ) : watchlists && watchlists.length > 0 ? (
                    <>
                      {watchlists.map((watchlist) => (
                        <div 
                          key={watchlist.id} 
                          className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${activeWatchlist === watchlist.id ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-gray-100'}`}
                          onClick={() => setActiveWatchlist(watchlist.id)}
                        >
                          <span>{watchlist.name}</span>
                          {activeWatchlist === watchlist.id && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWatchlist();
                              }}
                            >
                              <i className="ri-delete-bin-line text-gray-500"></i>
                            </Button>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="py-4 text-center text-gray-500">
                      No watchlists found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content - Watchlist details */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {watchlistDetails ? watchlistDetails.name : "Select a Watchlist"}
                  </CardTitle>
                  
                  {/* Add stock form */}
                  {activeWatchlist && (
                    <form onSubmit={handleAddSymbol} className="flex space-x-2">
                      <Input
                        placeholder="Add symbol (e.g., AAPL)"
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value)}
                        className="w-40"
                      />
                      <Button 
                        type="submit"
                        size="sm"
                        disabled={addToWatchlistMutation.isPending}
                      >
                        <i className="ri-add-line mr-1"></i> Add
                      </Button>
                    </form>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!activeWatchlist && (
                  <div className="py-8 text-center text-gray-500">
                    <p>Select a watchlist or create a new one</p>
                  </div>
                )}
                
                {activeWatchlist && isLoadingDetails && (
                  <div className="py-8 text-center text-gray-500">Loading watchlist data...</div>
                )}
                
                {activeWatchlist && watchlistDetails && (
                  <>
                    {watchlistDetails.stockData && watchlistDetails.stockData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="text-left text-gray-500 text-sm">
                              <th className="py-2 px-3">Symbol</th>
                              <th className="py-2 px-3">Last Price</th>
                              <th className="py-2 px-3">Change</th>
                              <th className="py-2 px-3">% Change</th>
                              <th className="py-2 px-3">Volume</th>
                              <th className="py-2 px-3"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {watchlistDetails.stockData.map((stock, index) => {
                              // Skip rendering if stock is null
                              if (!stock) {
                                return null;
                              }
                              
                              const isPositive = (stock.regularMarketChangePercent || 0) > 0;
                              return (
                                <tr 
                                  key={index} 
                                  className="border-t border-borderColor hover:bg-hoverBg cursor-pointer"
                                  onClick={() => stock.symbol ? navigateToStock(stock.symbol) : null}
                                >
                                  <td className="py-3 px-3">
                                    <div>
                                      <p className="font-medium">{stock.symbol || 'Unknown'}</p>
                                      <p className="text-gray-500 text-xs">{stock.shortName || stock.longName || 'Unknown'}</p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 font-medium">{formatNumber(stock.regularMarketPrice || 0)}</td>
                                  <td className={`py-3 px-3 ${isPositive ? 'text-secondary' : 'text-accent'}`}>
                                    {isPositive ? '+' : ''}{formatNumber(stock.regularMarketChange || 0)}
                                  </td>
                                  <td className={`py-3 px-3 ${isPositive ? 'text-secondary' : 'text-accent'}`}>
                                    {isPositive ? '+' : ''}{formatPercentage(stock.regularMarketChangePercent || 0)}
                                  </td>
                                  <td className="py-3 px-3">
                                    {stock.regularMarketVolume ? `${(stock.regularMarketVolume / 1e6).toFixed(2)}M` : "N/A"}
                                  </td>
                                  <td className="py-3 px-3">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (stock.symbol) {
                                          handleRemoveSymbol(stock.symbol);
                                        }
                                      }}
                                    >
                                      <i className="ri-close-line text-gray-500"></i>
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        <p>No stocks in this watchlist</p>
                        <p className="text-sm mt-1">Use the form above to add stocks</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WatchlistPage;