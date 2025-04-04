import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Watchlist as WatchlistType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StockQuote } from "@/types/stock";
import { useToast } from "@/hooks/use-toast";
import { formatNumber, formatPercentage } from "@/lib/utils";

interface WatchlistProps {
  watchlistId?: number;
  onSelectStock: (symbol: string) => void;
}

type WatchlistWithStocks = WatchlistType & {
  items: { id: number; symbol: string; watchlistId: number }[];
  stockData: StockQuote[];
};

const Watchlist = ({ watchlistId = 1, onSelectStock }: WatchlistProps) => {
  const { toast } = useToast();
  
  const { data: watchlist, isLoading } = useQuery<WatchlistWithStocks>({
    queryKey: [`/api/watchlists/${watchlistId}`],
  });
  
  const removeMutation = useMutation({
    mutationFn: async (symbol: string) => {
      await apiRequest("DELETE", `/api/watchlists/${watchlistId}/items/${symbol}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/watchlists/${watchlistId}`] });
      toast({ title: "Stock removed from watchlist" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to remove stock", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
  
  const handleRemove = (symbol: string) => {
    removeMutation.mutate(symbol);
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">My Watchlist</CardTitle>
          <Button variant="ghost" className="h-8 px-2 text-primary text-sm font-medium">
            <i className="ri-settings-4-line mr-1"></i> Manage
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <tr key={index} className="border-t border-borderColor">
                    <td className="py-3 px-3">
                      <div>
                        <Skeleton className="h-5 w-16 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </td>
                    <td className="py-3 px-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-5 w-14" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="py-3 px-3"></td>
                  </tr>
                ))
              ) : watchlist && watchlist.stockData && watchlist.stockData.length > 0 ? (
                watchlist.stockData.map((stock, index) => {
                  const isPositive = (stock.regularMarketChangePercent || 0) > 0;
                  return (
                    <tr 
                      key={index} 
                      className="border-t border-borderColor hover:bg-hoverBg cursor-pointer"
                      onClick={() => onSelectStock(stock.symbol)}
                    >
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-medium">{stock.symbol}</p>
                          <p className="text-gray-500 text-xs">{stock.shortName || stock.longName}</p>
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
                            handleRemove(stock.symbol);
                          }}
                        >
                          <i className="ri-close-line text-gray-500"></i>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    <p>No stocks in your watchlist</p>
                    <Button variant="outline" className="mt-2" onClick={() => onSelectStock("AAPL")}>
                      <i className="ri-add-line mr-1"></i> Add stocks
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default Watchlist;
