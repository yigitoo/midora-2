import { useState, useEffect } from 'react';
import { useStockWebSocket } from '@/hooks/use-stock-websocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { StockQuote } from '@/types/stock';

interface LiveStockTickerProps {
  symbols: string[];
  title?: string;
  className?: string;
  onSelectStock?: (symbol: string) => void;
}

export function LiveStockTicker({ 
  symbols, 
  title = 'Live Stock Prices',
  className = '',
  onSelectStock
}: LiveStockTickerProps) {
  const { quotes, errors, isConnected } = useStockWebSocket(symbols);
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({});
  const [priceChanges, setPriceChanges] = useState<Record<string, 'up' | 'down' | 'none'>>({});
  
  // Track price changes for animation
  useEffect(() => {
    Object.entries(quotes).forEach(([symbol, quote]) => {
      const prevPrice = previousPrices[symbol];
      const currentPrice = quote.regularMarketPrice;
      
      if (prevPrice && currentPrice && prevPrice !== currentPrice) {
        const changeDirection = currentPrice > prevPrice ? 'up' : 'down';
        setPriceChanges(prev => ({ ...prev, [symbol]: changeDirection }));
        
        // Reset animation after 1 second
        setTimeout(() => {
          setPriceChanges(prev => ({ ...prev, [symbol]: 'none' }));
        }, 1000);
      }
      
      if (currentPrice) {
        setPreviousPrices(prev => ({ ...prev, [symbol]: currentPrice }));
      }
    });
  }, [quotes, previousPrices]);
  
  // Sort stocks by percentage change
  const sortedStocks = Object.values(quotes).sort((a, b) => {
    const aChange = a.regularMarketChangePercent || 0;
    const bChange = b.regularMarketChangePercent || 0;
    return bChange - aChange;
  });
  
  const handleStockClick = (symbol: string) => {
    if (onSelectStock) {
      onSelectStock(symbol);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge variant={isConnected ? "outline" : "destructive"} className="text-xs">
            {isConnected ? "Live" : "Offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {sortedStocks.length > 0 ? (
            sortedStocks.map((stock) => {
              const isPositive = (stock.regularMarketChangePercent || 0) > 0;
              const changeDirection = priceChanges[stock.symbol] || 'none';
              const isChangeUp = changeDirection === 'up';
              const isChangeDown = changeDirection === 'down';
              
              return (
                <div 
                  key={stock.symbol}
                  className="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                  onClick={() => handleStockClick(stock.symbol)}
                >
                  <div className="flex flex-col">
                    <div className="font-medium">{stock.symbol}</div>
                    <div className="text-sm text-gray-500">{stock.shortName}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`font-medium ${isChangeUp ? 'text-green-600 animate-pulse' : isChangeDown ? 'text-red-600 animate-pulse' : ''}`}>
                      {formatNumber(stock.regularMarketPrice || 0)}
                    </div>
                    <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{formatPercentage(stock.regularMarketChangePercent || 0)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-gray-500">
              {symbols.length === 0 
                ? "No symbols selected" 
                : "Loading stock data..."}
            </div>
          )}
          
          {Object.keys(errors).length > 0 && (
            <div className="mt-2 text-sm text-red-500">
              {Object.entries(errors).map(([symbol, error]) => (
                <div key={symbol}>
                  Error loading {symbol}: {error}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}