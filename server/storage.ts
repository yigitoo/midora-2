import { users, type User, type InsertUser, type UserPreferences, type Watchlist, type WatchlistItem, type SearchHistory } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

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

// MongoDB Models
const userSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  membershipType: { type: String, default: 'Basic' },
  avatar: { type: String, default: null },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const userPreferencesSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true, unique: true },
  emailNotifications: { type: Boolean, default: true },
  priceAlerts: { type: Boolean, default: true },
  darkMode: { type: Boolean, default: false }
});

const watchlistSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const watchlistItemSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  watchlistId: { type: Number, required: true },
  symbol: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const searchHistorySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  symbol: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Define models (only if they haven't been compiled)
const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
const UserPreferencesModel = mongoose.models.UserPreferences || 
                             mongoose.model('UserPreferences', userPreferencesSchema);
const WatchlistModel = mongoose.models.Watchlist || 
                       mongoose.model('Watchlist', watchlistSchema);
const WatchlistItemModel = mongoose.models.WatchlistItem || 
                          mongoose.model('WatchlistItem', watchlistItemSchema);
const SearchHistoryModel = mongoose.models.SearchHistory || 
                          mongoose.model('SearchHistory', searchHistorySchema);

export class MongoDBStorage implements IStorage {
  sessionStore: session.SessionStore;
  private mongoClient: MongoClient | null = null;
  private isConnected = false;
  
  constructor() {
    // Initialize SessionStore
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Connect to MongoDB
    this.connect();
  }
  
  private async connect() {
    try {
      // Connect to MongoDB if not already connected
      if (!this.isConnected) {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockmarket';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');
        this.isConnected = true;
      }
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }
  
  async getUser(id: number): Promise<User | undefined> {
    try {
      await this.connect();
      const user = await UserModel.findOne({ id });
      if (!user) return undefined;
      
      return {
        id: user.id,
        username: user.username,
        password: user.password,
        email: user.email || '',
        membershipType: user.membershipType || 'Basic',
        avatar: user.avatar,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        createdAt: user.createdAt
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      await this.connect();
      const user = await UserModel.findOne({ username });
      if (!user) return undefined;
      
      return {
        id: user.id,
        username: user.username,
        password: user.password,
        email: user.email || '',
        membershipType: user.membershipType || 'Basic',
        avatar: user.avatar,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        createdAt: user.createdAt
      };
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      await this.connect();
      // Find highest ID from existing users or start with 1
      const highestUser = await UserModel.findOne().sort('-id');
      const nextId = highestUser ? highestUser.id + 1 : 1;
      
      const now = new Date();
      const newUser = new UserModel({
        id: nextId,
        ...insertUser,
        membershipType: "Basic",
        avatar: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        createdAt: now
      });
      
      await newUser.save();
      
      // Create default preferences for user
      const preferencesId = await this.getNextPreferencesId();
      const preferences = new UserPreferencesModel({
        id: preferencesId,
        userId: nextId,
        emailNotifications: true,
        priceAlerts: true,
        darkMode: false
      });
      
      await preferences.save();
      
      // Create default watchlist
      await this.createWatchlist({ userId: nextId, name: "My Watchlist" });
      
      return {
        id: nextId,
        username: insertUser.username,
        password: insertUser.password,
        email: insertUser.email || '',
        membershipType: "Basic",
        avatar: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        createdAt: now
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  private async getNextPreferencesId(): Promise<number> {
    const highestPref = await UserPreferencesModel.findOne().sort('-id');
    return highestPref ? highestPref.id + 1 : 1;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      await this.connect();
      const updatedUser = await UserModel.findOneAndUpdate(
        { id },
        { $set: userData },
        { new: true }
      );
      
      if (!updatedUser) return undefined;
      
      return {
        id: updatedUser.id,
        username: updatedUser.username,
        password: updatedUser.password,
        email: updatedUser.email || '',
        membershipType: updatedUser.membershipType || 'Basic',
        avatar: updatedUser.avatar,
        stripeCustomerId: updatedUser.stripeCustomerId,
        stripeSubscriptionId: updatedUser.stripeSubscriptionId,
        createdAt: updatedUser.createdAt
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }
  
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const user = await this.updateUser(userId, { stripeCustomerId: customerId });
    if (!user) throw new Error('User not found');
    return user;
  }
  
  async updateUserStripeInfo(userId: number, stripeInfo: { customerId: string, subscriptionId: string }): Promise<User> {
    const user = await this.updateUser(userId, { 
      stripeCustomerId: stripeInfo.customerId,
      stripeSubscriptionId: stripeInfo.subscriptionId,
      membershipType: "Pro" // Update membership type when subscription is created
    });
    
    if (!user) throw new Error('User not found');
    return user;
  }
  
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    try {
      await this.connect();
      const prefs = await UserPreferencesModel.findOne({ userId });
      if (!prefs) return undefined;
      
      return {
        id: prefs.id,
        userId: prefs.userId,
        emailNotifications: prefs.emailNotifications,
        priceAlerts: prefs.priceAlerts,
        darkMode: prefs.darkMode
      };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return undefined;
    }
  }
  
  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    try {
      await this.connect();
      const existingPrefs = await UserPreferencesModel.findOne({ userId });
      
      if (!existingPrefs) {
        // Create new preferences if they don't exist
        const preferencesId = await this.getNextPreferencesId();
        const newPrefs = new UserPreferencesModel({
          id: preferencesId,
          userId,
          ...preferences
        });
        
        await newPrefs.save();
        
        return {
          id: preferencesId,
          userId,
          emailNotifications: preferences.emailNotifications ?? true,
          priceAlerts: preferences.priceAlerts ?? true,
          darkMode: preferences.darkMode ?? false
        };
      }
      
      // Update existing preferences
      const updatedPrefs = await UserPreferencesModel.findOneAndUpdate(
        { userId },
        { $set: preferences },
        { new: true }
      );
      
      if (!updatedPrefs) return undefined;
      
      return {
        id: updatedPrefs.id,
        userId: updatedPrefs.userId,
        emailNotifications: updatedPrefs.emailNotifications,
        priceAlerts: updatedPrefs.priceAlerts,
        darkMode: updatedPrefs.darkMode
      };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return undefined;
    }
  }
  
  async getWatchlists(userId: number): Promise<Watchlist[]> {
    try {
      await this.connect();
      const watchlists = await WatchlistModel.find({ userId }).sort('name');
      
      return watchlists.map(wl => ({
        id: wl.id,
        userId: wl.userId,
        name: wl.name,
        createdAt: wl.createdAt
      }));
    } catch (error) {
      console.error('Error fetching watchlists:', error);
      return [];
    }
  }
  
  async getWatchlist(id: number): Promise<(Watchlist & { items: WatchlistItem[] }) | undefined> {
    try {
      await this.connect();
      const watchlist = await WatchlistModel.findOne({ id });
      if (!watchlist) return undefined;
      
      const items = await WatchlistItemModel.find({ watchlistId: id });
      
      return {
        id: watchlist.id,
        userId: watchlist.userId,
        name: watchlist.name,
        createdAt: watchlist.createdAt,
        items: items.map(item => ({
          id: item.id,
          watchlistId: item.watchlistId,
          symbol: item.symbol,
          createdAt: item.createdAt
        }))
      };
    } catch (error) {
      console.error('Error fetching watchlist with items:', error);
      return undefined;
    }
  }
  
  async createWatchlist(watchlistData: { userId: number, name: string }): Promise<Watchlist> {
    try {
      await this.connect();
      // Get highest ID or start with 1
      const highestWatchlist = await WatchlistModel.findOne().sort('-id');
      const nextId = highestWatchlist ? highestWatchlist.id + 1 : 1;
      
      const now = new Date();
      const newWatchlist = new WatchlistModel({
        id: nextId,
        userId: watchlistData.userId,
        name: watchlistData.name,
        createdAt: now
      });
      
      await newWatchlist.save();
      
      return {
        id: nextId,
        userId: watchlistData.userId,
        name: watchlistData.name,
        createdAt: now
      };
    } catch (error) {
      console.error('Error creating watchlist:', error);
      throw error;
    }
  }
  
  async addToWatchlist(watchlistId: number, symbol: string): Promise<WatchlistItem> {
    try {
      await this.connect();
      // Check if item already exists
      const existingItem = await WatchlistItemModel.findOne({ 
        watchlistId, 
        symbol: symbol.toUpperCase() 
      });
      
      if (existingItem) {
        return {
          id: existingItem.id,
          watchlistId: existingItem.watchlistId,
          symbol: existingItem.symbol,
          createdAt: existingItem.createdAt
        };
      }
      
      // Get highest ID or start with 1
      const highestItem = await WatchlistItemModel.findOne().sort('-id');
      const nextId = highestItem ? highestItem.id + 1 : 1;
      
      const now = new Date();
      const newItem = new WatchlistItemModel({
        id: nextId,
        watchlistId,
        symbol: symbol.toUpperCase(),
        createdAt: now
      });
      
      await newItem.save();
      
      return {
        id: nextId,
        watchlistId,
        symbol: symbol.toUpperCase(),
        createdAt: now
      };
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }
  
  async removeFromWatchlist(watchlistId: number, symbol: string): Promise<void> {
    try {
      await this.connect();
      await WatchlistItemModel.deleteMany({ 
        watchlistId, 
        symbol: symbol.toUpperCase() 
      });
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }
  
  async addSearchHistory(userId: number, symbol: string): Promise<SearchHistory> {
    try {
      await this.connect();
      // Find existing search history
      const existingSearch = await SearchHistoryModel.findOne({
        userId,
        symbol: symbol.toUpperCase()
      });
      
      if (existingSearch) {
        // Update timestamp
        existingSearch.timestamp = new Date();
        await existingSearch.save();
        
        return {
          id: existingSearch.id,
          userId: existingSearch.userId,
          symbol: existingSearch.symbol,
          timestamp: existingSearch.timestamp
        };
      }
      
      // Create new search history entry
      const highestSearch = await SearchHistoryModel.findOne().sort('-id');
      const nextId = highestSearch ? highestSearch.id + 1 : 1;
      
      const now = new Date();
      const newSearch = new SearchHistoryModel({
        id: nextId,
        userId,
        symbol: symbol.toUpperCase(),
        timestamp: now
      });
      
      await newSearch.save();
      
      return {
        id: nextId,
        userId,
        symbol: symbol.toUpperCase(),
        timestamp: now
      };
    } catch (error) {
      console.error('Error adding search history:', error);
      throw error;
    }
  }
  
  async getSearchHistory(userId: number, limit = 10): Promise<SearchHistory[]> {
    try {
      await this.connect();
      const history = await SearchHistoryModel.find({ userId })
        .sort('-timestamp')
        .limit(limit);
      
      return history.map(item => ({
        id: item.id,
        userId: item.userId,
        symbol: item.symbol,
        timestamp: item.timestamp
      }));
    } catch (error) {
      console.error('Error fetching search history:', error);
      return [];
    }
  }
}

// Try to use MongoDB first, fallback to MemStorage if connection fails
let storage: IStorage;
try {
  storage = new MongoDBStorage();
  console.log("Using MongoDB storage");
} catch (error) {
  console.warn("Failed to initialize MongoDB storage, falling back to in-memory storage:", error);
  storage = new MemStorage();
}

export { storage };
