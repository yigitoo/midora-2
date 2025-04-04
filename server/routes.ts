import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateCsv } from "./csv-export";
import yahooFinance from "yahoo-finance2";
import { ZodError } from "zod";
import { insertWatchlistItemSchema } from "@shared/schema";

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
      const { period = "1d", interval = "5m" } = req.query;
      
      const queryOptions = {
        period1: period === "1d" ? "1d" : undefined,
        period2: undefined,
        interval: interval as string
      };
      
      const result = await yahooFinance.historical(symbol, queryOptions);
      res.json(result);
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
      
      // Get stock data
      const stockData = await yahooFinance.historical(symbol, {
        period1: period as string
      });
      
      // Generate CSV
      const csv = generateCsv(stockData);
      
      // Set headers for CSV download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${symbol}_data.csv`);
      
      res.send(csv);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
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
  return httpServer;
}
