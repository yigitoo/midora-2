import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateCsv } from "./csv-export";
import yahooFinance from "yahoo-finance2";
import { ZodError } from "zod";
import { 
  insertWatchlistItemSchema, 
  insertForumCategorySchema, 
  insertForumTopicSchema, 
  insertForumReplySchema 
} from "@shared/schema";
import { WebSocketServer, WebSocket } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, etc.)
  setupAuth(app);

  // Get stock data
  app.get("/api/stocks/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const result = await yahooFinance.quote(symbol);
      
      // Add to search history if user is authenticated
      if (req.isAuthenticated()) {
        await storage.addSearchHistory(req.user!.id, symbol);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      res.status(500).json({ message: "Failed to fetch stock data" });
    }
  });

  // Get historical data for chart
  app.get("/api/stocks/:symbol/history", async (req, res) => {
    try {
      const { symbol } = req.params;
      const period = req.query.period as string || "1d";
      
      // YahooFinance only accepts 1d, 1wk, or 1mo for interval
      let interval: "1d" | "1wk" | "1mo" = "1d";
      if (req.query.interval === "1wk" || req.query.interval === "1mo") {
        interval = req.query.interval;
      }
      
      // Calculate period1 based on the period parameter
      const now = new Date();
      let period1: Date;
      
      switch(period) {
        case '1d':
          period1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '5d':
          period1 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
          break;
        case '1mo':
          period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3mo':
          period1 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6mo':
          period1 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          period1 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case '5y':
          period1 = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 1 month
      }
      
      const queryOptions = {
        period1,
        interval
      };
      
      const result = await yahooFinance.historical(symbol, queryOptions);
      
      // Convert Date objects to ISO strings for JSON serialization
      const formattedResult = result.map((item: any) => ({
        ...item,
        date: item.date.toISOString()
      }));
      
      res.json(formattedResult);
    } catch (error) {
      console.error("Error fetching historical data:", error);
      res.status(500).json({ message: "Failed to fetch historical data" });
    }
  });

  // Get market indices
  app.get("/api/market/indices", async (req, res) => {
    try {
      const indices = ["^GSPC", "^DJI", "^IXIC"]; // S&P 500, Dow Jones, NASDAQ
      const quotes = await Promise.all(
        indices.map(symbol => yahooFinance.quote(symbol))
      );
      
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching market indices:", error);
      res.status(500).json({ message: "Failed to fetch market indices" });
    }
  });

  // User watchlists
  app.get("/api/watchlists", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const watchlists = await storage.getWatchlists(req.user!.id);
      res.json(watchlists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch watchlists" });
    }
  });

  // Get watchlist with items
  app.get("/api/watchlists/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const watchlist = await storage.getWatchlist(parseInt(req.params.id));
      
      if (!watchlist || watchlist.userId !== req.user!.id) {
        return res.status(404).json({ message: "Watchlist not found" });
      }
      
      // Fetch current stock data for symbols
      const stockData = await Promise.all(
        watchlist.items.map(async (item) => {
          try {
            const quote = await yahooFinance.quote(item.symbol);
            return quote;
          } catch (e) {
            return { symbol: item.symbol, error: true };
          }
        })
      );
      
      res.json({
        ...watchlist,
        stockData
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  // Create watchlist
  app.post("/api/watchlists", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { name } = req.body;
      const watchlist = await storage.createWatchlist({
        userId: req.user!.id,
        name
      });
      
      res.status(201).json(watchlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to create watchlist" });
    }
  });

  // Add to watchlist
  app.post("/api/watchlists/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const watchlistId = parseInt(req.params.id);
      const watchlist = await storage.getWatchlist(watchlistId);
      
      if (!watchlist || watchlist.userId !== req.user!.id) {
        return res.status(404).json({ message: "Watchlist not found" });
      }
      
      const validatedData = insertWatchlistItemSchema.parse({
        watchlistId,
        symbol: req.body.symbol
      });
      
      const item = await storage.addToWatchlist(
        validatedData.watchlistId,
        validatedData.symbol
      );
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  // Remove from watchlist
  app.delete("/api/watchlists/:id/items/:symbol", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const watchlistId = parseInt(req.params.id);
      const { symbol } = req.params;
      const watchlist = await storage.getWatchlist(watchlistId);
      
      if (!watchlist || watchlist.userId !== req.user!.id) {
        return res.status(404).json({ message: "Watchlist not found" });
      }
      
      await storage.removeFromWatchlist(watchlistId, symbol);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  // Get recent activity (search history)
  app.get("/api/activity", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const history = await storage.getSearchHistory(req.user!.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Export stock data to CSV
  app.get("/api/export/:symbol", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { symbol } = req.params;
      const { period = "1mo" } = req.query;
      
      // Calculate period1 based on the period parameter
      const now = new Date();
      let period1: Date;
      
      switch(period as string) {
        case '1d':
          period1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '5d':
          period1 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
          break;
        case '1mo':
          period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3mo':
          period1 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6mo':
          period1 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          period1 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case '5y':
          period1 = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 1 month
      }
      
      // Get stock data
      const stockData = await yahooFinance.historical(symbol, {
        period1: period1
      });
      
      // Convert Date objects to ISO strings for CSV generation
      const formattedData = stockData.map((item: any) => ({
        ...item,
        date: item.date.toISOString().split('T')[0]  // Format as YYYY-MM-DD
      }));
      
      // Generate CSV
      const csv = generateCsv(formattedData);
      
      // Set headers for CSV download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${symbol}_data.csv`);
      
      res.send(csv);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });
  
  // Sync stock data with MongoDB
  app.post("/api/stocks/sync", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    
    try {
      const { symbol, data } = req.body;
      
      if (!symbol || !data) {
        return res.status(400).send("Missing symbol or data");
      }
      
      // You could store this in a collection in MongoDB
      // For now, we'll just log it and return success
      console.log(`Syncing data for ${symbol} to MongoDB`);
      
      // Also add to search history as a side effect
      await storage.addSearchHistory(req.user!.id, symbol);
      
      res.status(200).send("Data synced successfully");
    } catch (error) {
      console.error("Error syncing stock data:", error);
      res.status(500).send("Failed to sync stock data");
    }
  });

  // User preferences
  app.get("/api/preferences", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const preferences = await storage.getUserPreferences(req.user!.id);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  // Update user preferences
  app.patch("/api/preferences", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { emailNotifications, priceAlerts, darkMode } = req.body;
      const preferences = await storage.updateUserPreferences(req.user!.id, {
        emailNotifications,
        priceAlerts,
        darkMode
      });
      
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Update user profile
  app.patch("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { firstName, lastName, email, phone, avatar } = req.body;
      const user = await storage.updateUser(req.user!.id, {
        firstName,
        lastName,
        email,
        phone,
        avatar
      });
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Mock payment endpoint for membership
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { plan } = req.body;
      
      // Mock payment intent
      const paymentIntent = {
        clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 10)}`,
        amount: plan === "basic" ? 900 : plan === "pro" ? 2900 : 4900,
        currency: "usd",
        status: "requires_payment_method"
      };
      
      res.json({ clientSecret: paymentIntent.clientSecret });
    } catch (error) {
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Update membership after successful payment (for mock purposes)
  app.post("/api/update-membership", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { membershipType } = req.body;
      const user = await storage.updateUser(req.user!.id, {
        membershipType
      });
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update membership" });
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time stock updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Keep track of subscribed symbols and associated clients
  const subscriptions: Map<string, Set<WebSocket>> = new Map();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Handle subscription messages from client
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe') {
          // Subscribe to symbol
          const symbol = data.symbol.toUpperCase();
          
          if (!subscriptions.has(symbol)) {
            subscriptions.set(symbol, new Set());
          }
          
          subscriptions.get(symbol)?.add(ws);
          
          // Send initial data
          try {
            const quote = await yahooFinance.quote(symbol);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'quote',
                symbol,
                data: quote
              }));
            }
          } catch (error) {
            console.error(`Error fetching initial data for ${symbol}:`, error);
          }
          
          console.log(`Client subscribed to ${symbol}`);
        } else if (data.type === 'unsubscribe') {
          // Unsubscribe from symbol
          const symbol = data.symbol.toUpperCase();
          
          if (subscriptions.has(symbol)) {
            subscriptions.get(symbol)?.delete(ws);
            
            // Clean up if no more subscribers
            if (subscriptions.get(symbol)?.size === 0) {
              subscriptions.delete(symbol);
            }
          }
          
          console.log(`Client unsubscribed from ${symbol}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      
      // Remove client from all subscriptions
      for (const [symbol, clients] of subscriptions.entries()) {
        clients.delete(ws);
        
        // Clean up if no more subscribers
        if (clients.size === 0) {
          subscriptions.delete(symbol);
        }
      }
    });
  });
  
  // Start periodic updates for subscribed symbols (every 5 seconds)
  const updateInterval = 5000; // 5 seconds
  
  setInterval(async () => {
    // Skip if no subscriptions
    if (subscriptions.size === 0) return;
    
    // Get all subscribed symbols
    const symbols = Array.from(subscriptions.keys());
    
    try {
      // Fetch latest quotes for all subscribed symbols
      const quotes = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            return {
              symbol,
              data: await yahooFinance.quote(symbol),
              error: null
            };
          } catch (error) {
            console.error(`Error fetching update for ${symbol}:`, error);
            return {
              symbol,
              data: null,
              error: 'Failed to fetch data'
            };
          }
        })
      );
      
      // Send updates to subscribed clients
      for (const quote of quotes) {
        const { symbol, data, error } = quote;
        const clients = subscriptions.get(symbol);
        
        if (clients) {
          const message = JSON.stringify({
            type: 'quote',
            symbol,
            data: data || null,
            error,
            timestamp: Date.now()
          });
          
          // Send to all subscribed clients
          for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating stock data:', error);
    }
  }, updateInterval);
  
  // Forum routes
  app.get("/api/forum/categories", async (req, res) => {
    try {
      const categories = await storage.getForumCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching forum categories:", error);
      res.status(500).json({ message: "Failed to fetch forum categories" });
    }
  });
  
  app.get("/api/forum/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.getForumCategory(Number(id));
      
      if (!category) {
        return res.status(404).json({ message: "Forum category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching forum category:", error);
      res.status(500).json({ message: "Failed to fetch forum category" });
    }
  });
  
  app.post("/api/forum/categories", async (req, res) => {
    try {
      // Only admin can create categories
      if (!req.isAuthenticated() || req.user.membershipType !== "Pro") {
        return res.status(403).json({ message: "Only Pro members can create forum categories" });
      }
      
      const validatedData = insertForumCategorySchema.parse(req.body);
      const category = await storage.createForumCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating forum category:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create forum category" });
    }
  });
  
  app.get("/api/forum/topics", async (req, res) => {
    try {
      const categoryId = Number(req.query.categoryId);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      
      if (!categoryId) {
        return res.status(400).json({ message: "Category ID is required" });
      }
      
      const topics = await storage.getForumTopics(categoryId, page, limit);
      res.json(topics);
    } catch (error) {
      console.error("Error fetching forum topics:", error);
      res.status(500).json({ message: "Failed to fetch forum topics" });
    }
  });
  
  app.get("/api/forum/topics/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const topic = await storage.getForumTopic(Number(id));
      
      if (!topic) {
        return res.status(404).json({ message: "Forum topic not found" });
      }
      
      // Increment view count
      await storage.incrementTopicViews(Number(id));
      
      res.json(topic);
    } catch (error) {
      console.error("Error fetching forum topic:", error);
      res.status(500).json({ message: "Failed to fetch forum topic" });
    }
  });
  
  app.post("/api/forum/topics", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to create a topic" });
      }
      
      const topicData = { ...req.body, userId: req.user.id };
      const validatedData = insertForumTopicSchema.parse(topicData);
      const topic = await storage.createForumTopic(validatedData);
      res.status(201).json(topic);
    } catch (error) {
      console.error("Error creating forum topic:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create forum topic" });
    }
  });
  
  app.get("/api/forum/replies", async (req, res) => {
    try {
      const topicId = Number(req.query.topicId);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      
      if (!topicId) {
        return res.status(400).json({ message: "Topic ID is required" });
      }
      
      const replies = await storage.getForumReplies(topicId, page, limit);
      res.json(replies);
    } catch (error) {
      console.error("Error fetching forum replies:", error);
      res.status(500).json({ message: "Failed to fetch forum replies" });
    }
  });
  
  app.post("/api/forum/replies", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to reply" });
      }
      
      const replyData = { ...req.body, userId: req.user.id };
      const validatedData = insertForumReplySchema.parse(replyData);
      const reply = await storage.createForumReply(validatedData);
      res.status(201).json(reply);
    } catch (error) {
      console.error("Error creating forum reply:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create forum reply" });
    }
  });
  
  return httpServer;
}
