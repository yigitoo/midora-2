import { useState, useEffect } from 'react';
import { useStockWebSocket } from '@/hooks/use-stock-websocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { StockQuote } from '@/types/stock';
import { ArrowUp, ArrowDown, Activity, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveStockTickerProps {
  symbols: string[];
  title?: string;
  className?: string;
  onSelectStock?: (symbol: string) => void;
}

export function LiveStockTicker({ 
  symbols, 
  title = 'Live Market Data',
  className = '',
  onSelectStock
}: LiveStockTickerProps) {
  const { quotes, error, connected } = useStockWebSocket(symbols);
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({});
  const [priceChanges, setPriceChanges] = useState<Record<string, 'up' | 'down' | 'none'>>({});
  const [tickerMode, setTickerMode] = useState<'list' | 'ticker'>('list');
  const [showAnimation, setShowAnimation] = useState(true);
  
  // Track price changes for animation
  useEffect(() => {
    if (!quotes) return;
    
    Object.entries(quotes).forEach(([symbol, quote]) => {
      if (!quote || !quote.regularMarketPrice) return;
      
      const prevPrice = previousPrices[symbol];
      const currentPrice = quote.regularMarketPrice;
      
      if (prevPrice && currentPrice && prevPrice !== currentPrice && showAnimation) {
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
  }, [quotes, previousPrices, showAnimation]);
  
  // Sort stocks by percentage change
  const sortedStocks = quotes ? Object.values(quotes)
    .filter(quote => quote && quote.symbol) // Filter out invalid quotes
    .sort((a, b) => {
      const aChange = a.regularMarketChangePercent || 0;
      const bChange = b.regularMarketChangePercent || 0;
      return bChange - aChange;
    }) : [];
  
  const handleStockClick = (symbol: string) => {
    if (onSelectStock) {
      onSelectStock(symbol);
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-card">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connected ? "secondary" : "destructive"} className="text-xs flex items-center gap-1">
              {connected ? (
                <>
                  <span className="animate-pulse relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                  </span>
                  Live
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" /> Offline
                </>
              )}
            </Badge>
            <div className="flex bg-muted rounded-md overflow-hidden text-xs">
              <button 
                onClick={() => setTickerMode('list')} 
                className={`px-2 py-1 ${tickerMode === 'list' ? 'bg-primary text-primary-foreground' : ''}`}
              >
                List
              </button>
              <button 
                onClick={() => setTickerMode('ticker')} 
                className={`px-2 py-1 ${tickerMode === 'ticker' ? 'bg-primary text-primary-foreground' : ''}`}
              >
                Ticker
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {tickerMode === 'list' ? (
        <CardContent className="max-h-[320px] overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {sortedStocks.length > 0 ? (
              sortedStocks.map((stock) => {
                if (!stock || !stock.symbol) return null;
                
                const isPositive = (stock.regularMarketChangePercent || 0) > 0;
                const isNeutral = (stock.regularMarketChangePercent || 0) === 0;
                const changeDirection = priceChanges[stock.symbol] || 'none';
                const isChangeUp = changeDirection === 'up';
                const isChangeDown = changeDirection === 'down';
                
                return (
                  <div 
                    key={stock.symbol}
                    className="flex justify-between items-center p-2 hover:bg-hoverBg rounded-md cursor-pointer transition-colors duration-150"
                    onClick={() => handleStockClick(stock.symbol)}
                  >
                    <div className="flex flex-col">
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px]">{stock.shortName}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={cn(
                        "font-medium flex items-center",
                        isChangeUp && "text-up animate-pulse",
                        isChangeDown && "text-down animate-pulse"
                      )}>
                        {formatNumber(stock.regularMarketPrice || 0)}
                        {isChangeUp && <ArrowUp className="h-3 w-3 ml-1" />}
                        {isChangeDown && <ArrowDown className="h-3 w-3 ml-1" />}
                      </div>
                      <div className={cn(
                        "text-xs flex items-center",
                        isPositive && "text-up",
                        !isPositive && !isNeutral && "text-down",
                        isNeutral && "text-muted-foreground"
                      )}>
                        {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : !isNeutral ? <ArrowDown className="h-3 w-3 mr-1" /> : null}
                        {formatPercentage(stock.regularMarketChangePercent || 0)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                {symbols.length === 0 ? (
                  <>
                    <Activity className="h-12 w-12 mb-2 text-muted" />
                    No symbols selected
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-12 w-12 mb-2 text-muted animate-spin" />
                    Loading stock data...
                  </>
                )}
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                <p className="font-medium">Data Error</p>
                <p>{error}</p>
              </div>
            )}
          </div>
        </CardContent>
      ) : (
        <div className="overflow-hidden">
          {sortedStocks.length > 0 ? (
            <div className="py-3 flex items-center bg-muted/50 animate-marquee whitespace-nowrap">
              {/* Duplicate the stocks for continuous scrolling */}
              {[...sortedStocks, ...sortedStocks].map((stock, index) => {
                if (!stock || !stock.symbol) return null;
                
                const isPositive = (stock.regularMarketChangePercent || 0) > 0;
                const isNeutral = (stock.regularMarketChangePercent || 0) === 0;
                
                return (
                  <div 
                    key={`${stock.symbol}-${index}`}
                    className="inline-flex items-center mx-3 cursor-pointer"
                    onClick={() => handleStockClick(stock.symbol)}
                  >
                    <span className="font-medium mr-1">{stock.symbol}</span>
                    <span className={cn(
                      "font-medium",
                      isPositive && "text-up",
                      !isPositive && !isNeutral && "text-down",
                      isNeutral && "text-foreground"
                    )}>
                      {formatNumber(stock.regularMarketPrice || 0)}
                    </span>
                    <span className={cn(
                      "text-xs ml-1 flex items-center",
                      isPositive && "text-up",
                      !isPositive && !isNeutral && "text-down",
                      isNeutral && "text-muted-foreground"
                    )}>
                      {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : !isNeutral ? <ArrowDown className="h-3 w-3 mr-1" /> : null}
                      {formatPercentage(stock.regularMarketChangePercent || 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              {symbols.length === 0 
                ? "No symbols selected" 
                : "Loading stock data..."}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}