import { useState, useEffect, useRef } from 'react';
import { StockQuote, StockWebSocketMessage } from '@/types/stock';
import { apiRequest } from '@/lib/queryClient';

type SubscriptionMessage = {
  type: 'subscribe' | 'unsubscribe';
  symbol: string;
};

type QuoteMessage = {
  type: 'quote';
  symbol: string;
  data: StockQuote;
  error: string | null;
  timestamp?: number;
};

interface StockQuoteWithMeta extends StockQuote {
  _error?: string | null;
  _timestamp?: number;
}

type WebSocketMessage = SubscriptionMessage | QuoteMessage;

/**
 * Custom hook for real-time stock data using WebSockets
 * @param symbols Array of stock symbols to subscribe to
 * @returns Object containing real-time stock quotes and error state
 */
export function useStockWebSocket(symbols: string[]) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Record<string, StockQuoteWithMeta> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const symbolsRef = useRef<string[]>(symbols);

  // Keep track of the latest symbols array
  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  // Setup WebSocket connection
  useEffect(() => {
    // Create WebSocket connection
    const setupWebSocket = () => {
      try {
        // Fix WebSocket URL construction to avoid 'localhost:undefined' error
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.hostname;
        const wsUrl = `${protocol}//${host}/ws`;
        console.log(`Connecting to WebSocket at: ${wsUrl}`);
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          console.log('WebSocket connection established');
          setConnected(true);
          setError(null);
          
          // Initialize an empty quotes object
          if (!quotes) {
            setQuotes({});
          }
          
          // Subscribe to symbols
          symbolsRef.current.forEach(symbol => {
            const message: SubscriptionMessage = {
              type: 'subscribe',
              symbol: symbol.toUpperCase()
            };
            socket.send(JSON.stringify(message));
          });
        };
        
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as QuoteMessage;
            
            if (message.type === 'quote') {
              setQuotes(prev => {
                if (!prev) prev = {};
                return {
                  ...prev,
                  [message.symbol]: {
                    ...message.data,
                    _error: message.error,
                    _timestamp: message.timestamp || Date.now()
                  }
                };
              });
              
              // Sync with MongoDB if we have a valid quote
              if (message.data && !message.error) {
                syncStockDataWithMongoDB(message.symbol, message.data);
              }
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };
        
        socket.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          setConnected(false);
          
          // Attempt to reconnect unless the connection was closed cleanly
          if (event.code !== 1000) {
            setError('Connection lost. Attempting to reconnect...');
            
            if (reconnectTimeoutRef.current) {
              window.clearTimeout(reconnectTimeoutRef.current);
            }
            
            reconnectTimeoutRef.current = window.setTimeout(() => {
              setupWebSocket();
            }, 3000);
          }
        };
        
        socket.onerror = (event) => {
          console.error('WebSocket error:', event);
          setError('Error connecting to real-time data service');
        };
        
        socketRef.current = socket;
      } catch (err) {
        console.error('Failed to setup WebSocket:', err);
        setError('Failed to connect to real-time data service');
      }
    };
    
    setupWebSocket();
    
    // Cleanup function
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        // Unsubscribe from all symbols
        symbolsRef.current.forEach(symbol => {
          const message: SubscriptionMessage = {
            type: 'unsubscribe',
            symbol: symbol.toUpperCase()
          };
          socketRef.current?.send(JSON.stringify(message));
        });
        
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []); // Only run once on mount
  
  // Handle changes to symbols array
  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Subscribe to new symbols
      symbols.forEach(symbol => {
        if (!quotes || !quotes[symbol]) {
          const message: SubscriptionMessage = {
            type: 'subscribe',
            symbol: symbol.toUpperCase()
          };
          socketRef.current?.send(JSON.stringify(message));
        }
      });
      
      // Unsubscribe from removed symbols
      if (quotes) {
        Object.keys(quotes).forEach(symbol => {
          if (!symbols.includes(symbol)) {
            const message: SubscriptionMessage = {
              type: 'unsubscribe',
              symbol: symbol.toUpperCase()
            };
            socketRef.current?.send(JSON.stringify(message));
            
            // Remove from quotes state
            setQuotes(prev => {
              if (!prev) return prev;
              const updated = { ...prev };
              delete updated[symbol];
              return updated;
            });
          }
        });
      }
    }
  }, [symbols, quotes]);
  
  // Sync stock data with MongoDB
  const syncStockDataWithMongoDB = async (symbol: string, data: StockQuote) => {
    try {
      // This endpoint would be created on the server to store stock data
      await apiRequest('POST', '/api/stocks/sync', {
        symbol,
        data
      }).catch(err => {
        // Silently fail - we don't want to disrupt the UI
        console.error('Failed to sync stock data:', err);
      });
    } catch (error) {
      console.error('Error syncing stock data with MongoDB:', error);
    }
  };
  
  return {
    quotes,
    error,
    connected,
  };
}