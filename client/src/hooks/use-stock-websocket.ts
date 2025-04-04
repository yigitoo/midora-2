import { useState, useEffect, useRef } from 'react';
import { StockQuote, StockWebSocketMessage } from '@/types/stock';

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
  const [quotes, setQuotes] = useState<Record<string, StockQuoteWithMeta>>({});
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Setup WebSocket connection
  useEffect(() => {
    // Create WebSocket connection
    const setupWebSocket = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          console.log('WebSocket connection established');
          setConnected(true);
          setError(null);
          
          // Subscribe to symbols
          symbols.forEach(symbol => {
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
              setQuotes(prev => ({
                ...prev,
                [message.symbol]: {
                  ...message.data,
                  _error: message.error,
                  _timestamp: message.timestamp || Date.now()
                }
              }));
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
        symbols.forEach(symbol => {
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
  }, [symbols.join(',')]); // Only re-run if the symbols array changes
  
  // Handle adding new symbols
  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      symbols.forEach(symbol => {
        if (!quotes[symbol]) {
          const message: SubscriptionMessage = {
            type: 'subscribe',
            symbol: symbol.toUpperCase()
          };
          socketRef.current?.send(JSON.stringify(message));
        }
      });
    }
  }, [symbols, quotes]);
  
  return {
    connected,
    error,
    quotes,
  };
}