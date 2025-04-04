import { users, type User, type InsertUser, type UserPreferences, type Watchlist, type WatchlistItem, type SearchHistory } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: { customerId: string, subscriptionId: string }): Promise<User>;
  
  // User preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences | undefined>;
  
  // Watchlist operations
  getWatchlists(userId: number): Promise<Watchlist[]>;
  getWatchlist(id: number): Promise<(Watchlist & { items: WatchlistItem[] }) | undefined>;
  createWatchlist(watchlist: { userId: number, name: string }): Promise<Watchlist>;
  addToWatchlist(watchlistId: number, symbol: string): Promise<WatchlistItem>;
  removeFromWatchlist(watchlistId: number, symbol: string): Promise<void>;
  
  // Search history
  addSearchHistory(userId: number, symbol: string): Promise<SearchHistory>;
  getSearchHistory(userId: number, limit?: number): Promise<SearchHistory[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userPreferences: Map<number, UserPreferences>;
  private watchlists: Map<number, Watchlist>;
  private watchlistItems: Map<number, WatchlistItem>;
  private searchHistory: Map<number, SearchHistory>;
  sessionStore: session.SessionStore;
  currentUserId: number;
  currentPreferencesId: number;
  currentWatchlistId: number;
  currentWatchlistItemId: number;
  currentSearchHistoryId: number;

  constructor() {
    this.users = new Map();
    this.userPreferences = new Map();
    this.watchlists = new Map();
    this.watchlistItems = new Map();
    this.searchHistory = new Map();
    this.currentUserId = 1;
    this.currentPreferencesId = 1;
    this.currentWatchlistId = 1;
    this.currentWatchlistItemId = 1;
    this.currentSearchHistoryId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      membershipType: "Basic",
      avatar: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: now
    };
    this.users.set(id, user);
    
    // Create default preferences for user
    const preferencesId = this.currentPreferencesId++;
    const preferences: UserPreferences = {
      id: preferencesId,
      userId: id,
      emailNotifications: true,
      priceAlerts: true,
      darkMode: false
    };
    this.userPreferences.set(preferencesId, preferences);
    
    // Create default watchlist
    this.createWatchlist({ userId: id, name: "My Watchlist" });
    
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, stripeCustomerId: customerId };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(userId: number, stripeInfo: { customerId: string, subscriptionId: string }): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { 
      ...user, 
      stripeCustomerId: stripeInfo.customerId,
      stripeSubscriptionId: stripeInfo.subscriptionId,
      membershipType: "Pro" // Update membership type when subscription is created
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // User preferences
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(
      (pref) => pref.userId === userId
    );
  }

  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const userPrefs = Array.from(this.userPreferences.values()).find(
      (pref) => pref.userId === userId
    );
    
    if (!userPrefs) return undefined;
    
    const updatedPrefs = { ...userPrefs, ...preferences };
    this.userPreferences.set(userPrefs.id, updatedPrefs);
    return updatedPrefs;
  }

  // Watchlist operations
  async getWatchlists(userId: number): Promise<Watchlist[]> {
    return Array.from(this.watchlists.values()).filter(
      (watchlist) => watchlist.userId === userId
    );
  }

  async getWatchlist(id: number): Promise<(Watchlist & { items: WatchlistItem[] }) | undefined> {
    const watchlist = this.watchlists.get(id);
    if (!watchlist) return undefined;
    
    const items = Array.from(this.watchlistItems.values()).filter(
      (item) => item.watchlistId === id
    );
    
    return { ...watchlist, items };
  }

  async createWatchlist(watchlistData: { userId: number, name: string }): Promise<Watchlist> {
    const id = this.currentWatchlistId++;
    const now = new Date();
    const watchlist: Watchlist = {
      id,
      userId: watchlistData.userId,
      name: watchlistData.name,
      createdAt: now
    };
    
    this.watchlists.set(id, watchlist);
    return watchlist;
  }

  async addToWatchlist(watchlistId: number, symbol: string): Promise<WatchlistItem> {
    const id = this.currentWatchlistItemId++;
    const now = new Date();
    const item: WatchlistItem = {
      id,
      watchlistId,
      symbol,
      createdAt: now
    };
    
    this.watchlistItems.set(id, item);
    return item;
  }

  async removeFromWatchlist(watchlistId: number, symbol: string): Promise<void> {
    const items = Array.from(this.watchlistItems.entries()).filter(
      ([_, item]) => item.watchlistId === watchlistId && item.symbol === symbol
    );
    
    for (const [id, _] of items) {
      this.watchlistItems.delete(id);
    }
  }

  // Search history
  async addSearchHistory(userId: number, symbol: string): Promise<SearchHistory> {
    const id = this.currentSearchHistoryId++;
    const now = new Date();
    
    const searchEntry: SearchHistory = {
      id,
      userId,
      symbol,
      timestamp: now
    };
    
    this.searchHistory.set(id, searchEntry);
    return searchEntry;
  }

  async getSearchHistory(userId: number, limit = 10): Promise<SearchHistory[]> {
    const history = Array.from(this.searchHistory.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    
    return history;
  }
}

export const storage = new MemStorage();
