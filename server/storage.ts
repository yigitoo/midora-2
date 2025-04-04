import { users, type User, type InsertUser, type UserPreferences, type Watchlist, 
  type WatchlistItem, type SearchHistory, type ForumCategory, type ForumTopic, 
  type ForumReply, type InsertForumCategory, type InsertForumTopic, type InsertForumReply,
  UserModel, UserPreferencesModel, WatchlistModel, WatchlistItemModel, SearchHistoryModel,
  ForumCategoryModel, ForumTopicModel, ForumReplyModel 
} from "@shared/schema";
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
  
  // Forum operations
  getForumCategories(): Promise<ForumCategory[]>;
  getForumCategory(id: number): Promise<ForumCategory | undefined>;
  createForumCategory(category: InsertForumCategory): Promise<ForumCategory>;
  
  getForumTopics(categoryId: number, page?: number, limit?: number): Promise<ForumTopic[]>;
  getForumTopic(id: number): Promise<ForumTopic | undefined>;
  createForumTopic(topic: InsertForumTopic): Promise<ForumTopic>;
  incrementTopicViews(topicId: number): Promise<void>;
  
  getForumReplies(topicId: number, page?: number, limit?: number): Promise<ForumReply[]>;
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;
  
  // Session store
  sessionStore: any; // Using any since the express-session types are not properly exported
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userPreferences: Map<number, UserPreferences>;
  private watchlists: Map<number, Watchlist>;
  private watchlistItems: Map<number, WatchlistItem>;
  private searchHistory: Map<number, SearchHistory>;
  sessionStore: any; // Using any since express-session types are not properly exported
  currentUserId: number;
  currentPreferencesId: number;
  currentWatchlistId: number;
  currentWatchlistItemId: number;
  currentSearchHistoryId: number;

  private forumCategories: Map<number, ForumCategory>;
  private forumTopics: Map<number, ForumTopic>;
  private forumReplies: Map<number, ForumReply>;
  currentForumCategoryId: number;
  currentForumTopicId: number;
  currentForumReplyId: number;
  
  constructor() {
    this.users = new Map();
    this.userPreferences = new Map();
    this.watchlists = new Map();
    this.watchlistItems = new Map();
    this.searchHistory = new Map();
    this.forumCategories = new Map();
    this.forumTopics = new Map();
    this.forumReplies = new Map();
    
    this.currentUserId = 1;
    this.currentPreferencesId = 1;
    this.currentWatchlistId = 1;
    this.currentWatchlistItemId = 1;
    this.currentSearchHistoryId = 1;
    this.currentForumCategoryId = 1;
    this.currentForumTopicId = 1;
    this.currentForumReplyId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
    
    // Initialize forum data
    this.initForumData();
  }
  
  // Initialize forum data with sample content
  private initForumData() {
    // Create default forum categories
    const markets = this.createForumCategoryInternal({
      name: "Market Analysis",
      description: "Discuss stock market trends and analysis techniques",
      order: 1
    });
    
    const economics = this.createForumCategoryInternal({
      name: "Economics & Global Markets",
      description: "Discussions about economics and global market impacts",
      order: 2
    });
    
    const news = this.createForumCategoryInternal({
      name: "Financial News",
      description: "Talk about the latest financial news and events",
      order: 3
    });
    
    const strategies = this.createForumCategoryInternal({
      name: "Trading Strategies",
      description: "Share and discuss trading strategies and approaches",
      order: 4
    });
    
    const tech = this.createForumCategoryInternal({
      name: "Technology Stocks",
      description: "Focused discussions on technology sector stocks",
      order: 5
    });

    // Create sample topics for the market analysis category
    const topic1 = this.createForumTopicInternal({
      categoryId: markets.id,
      userId: 1,
      title: "S&P 500 Technical Analysis - April 2025",
      content: "I've been analyzing the S&P 500 chart patterns for April 2025 and noticed some interesting trends. The market seems to be forming a strong support level at 5,800. What are your thoughts on potential resistance levels for the coming weeks?",
      views: 42,
      isPinned: true,
      isLocked: false,
      lastReplyAt: new Date(),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    });
    
    const topic2 = this.createForumTopicInternal({
      categoryId: tech.id,
      userId: 1,
      title: "AI Companies Growth Potential",
      content: "I'm looking at several AI-focused companies that have shown strong growth over the past year. Companies like NVIDIA, Microsoft, and Google have made significant investments in AI. Which AI stocks do you think have the biggest growth potential for the next 5 years?",
      views: 28,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    });

    // Add some sample replies
    this.createForumReplyInternal({
      topicId: topic1.id,
      userId: 1,
      content: "Great analysis! I think we might see resistance at 6,000 based on previous patterns. The market has been quite bullish lately despite economic uncertainties.",
      isEdited: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      editedAt: undefined
    });
    
    this.createForumReplyInternal({
      topicId: topic1.id,
      userId: 1,
      content: "I've been tracking moving averages and we're well above the 200-day MA, which suggests continued upward momentum. However, I'm keeping an eye on the MACD for any signs of divergence.",
      isEdited: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      editedAt: undefined
    });
  }
  
  private createForumCategoryInternal(data: Partial<ForumCategory>): ForumCategory {
    const id = this.currentForumCategoryId++;
    const category: ForumCategory = {
      id,
      name: data.name || "Unnamed Category",
      description: data.description,
      order: data.order || 0,
      createdAt: new Date()
    };
    this.forumCategories.set(id, category);
    return category;
  }
  
  private createForumTopicInternal(data: Partial<ForumTopic>): ForumTopic {
    const id = this.currentForumTopicId++;
    const topic: ForumTopic = {
      id,
      categoryId: data.categoryId || 1,
      userId: data.userId || 1,
      title: data.title || "Unnamed Topic",
      content: data.content || "",
      views: data.views || 0,
      isPinned: data.isPinned || false,
      isLocked: data.isLocked || false,
      lastReplyAt: data.lastReplyAt || new Date(),
      createdAt: data.createdAt || new Date()
    };
    this.forumTopics.set(id, topic);
    return topic;
  }
  
  private createForumReplyInternal(data: Partial<ForumReply>): ForumReply {
    const id = this.currentForumReplyId++;
    const reply: ForumReply = {
      id,
      topicId: data.topicId || 1,
      userId: data.userId || 1,
      content: data.content || "",
      isEdited: data.isEdited || false,
      createdAt: data.createdAt || new Date(),
      editedAt: data.editedAt
    };
    this.forumReplies.set(id, reply);
    
    // Update the lastReplyAt for the topic
    const topic = this.forumTopics.get(reply.topicId);
    if (topic) {
      topic.lastReplyAt = reply.createdAt;
    }
    
    return reply;
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
      avatar: undefined,
      stripeCustomerId: undefined,
      stripeSubscriptionId: undefined,
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
  
  // Forum operations
  async getForumCategories(): Promise<ForumCategory[]> {
    return Array.from(this.forumCategories.values())
      .sort((a, b) => a.order - b.order);
  }
  
  async getForumCategory(id: number): Promise<ForumCategory | undefined> {
    return this.forumCategories.get(id);
  }
  
  async createForumCategory(category: InsertForumCategory): Promise<ForumCategory> {
    return this.createForumCategoryInternal(category);
  }
  
  async getForumTopics(categoryId: number, page = 1, limit = 20): Promise<ForumTopic[]> {
    const topics = Array.from(this.forumTopics.values())
      .filter(topic => topic.categoryId === categoryId)
      .sort((a, b) => {
        // Pinned topics first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        // Then sort by most recent activity
        return b.lastReplyAt.getTime() - a.lastReplyAt.getTime();
      });
    
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return topics.slice(start, end);
  }
  
  async getForumTopic(id: number): Promise<ForumTopic | undefined> {
    return this.forumTopics.get(id);
  }
  
  async createForumTopic(topic: InsertForumTopic): Promise<ForumTopic> {
    const newTopic: Partial<ForumTopic> = {
      ...topic,
      views: 0,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date()
    };
    
    return this.createForumTopicInternal(newTopic);
  }
  
  async incrementTopicViews(topicId: number): Promise<void> {
    const topic = this.forumTopics.get(topicId);
    if (topic) {
      topic.views++;
    }
  }
  
  async getForumReplies(topicId: number, page = 1, limit = 20): Promise<ForumReply[]> {
    const replies = Array.from(this.forumReplies.values())
      .filter(reply => reply.topicId === topicId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return replies.slice(start, end);
  }
  
  async createForumReply(reply: InsertForumReply): Promise<ForumReply> {
    return this.createForumReplyInternal(reply);
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

// We're using models from shared/schema.ts instead of defining them here

export class MongoDBStorage implements IStorage {
  sessionStore: any; // Using any since express-session types are not properly exported
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
        avatar: undefined,
        stripeCustomerId: undefined,
        stripeSubscriptionId: undefined,
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
        avatar: undefined,
        stripeCustomerId: undefined,
        stripeSubscriptionId: undefined,
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
  
  // Forum operations
  async getForumCategories(): Promise<ForumCategory[]> {
    try {
      await this.connect();
      const categories = await ForumCategoryModel.find().sort('order');
      
      return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        order: cat.order,
        createdAt: cat.createdAt
      }));
    } catch (error) {
      console.error('Error fetching forum categories:', error);
      return [];
    }
  }
  
  async getForumCategory(id: number): Promise<ForumCategory | undefined> {
    try {
      await this.connect();
      const category = await ForumCategoryModel.findOne({ id });
      if (!category) return undefined;
      
      return {
        id: category.id,
        name: category.name,
        description: category.description,
        order: category.order,
        createdAt: category.createdAt
      };
    } catch (error) {
      console.error('Error fetching forum category:', error);
      return undefined;
    }
  }
  
  async createForumCategory(categoryData: InsertForumCategory): Promise<ForumCategory> {
    try {
      await this.connect();
      // Get highest ID or start with 1
      const highestCategory = await ForumCategoryModel.findOne().sort('-id');
      const nextId = highestCategory ? highestCategory.id + 1 : 1;
      
      const now = new Date();
      const newCategory = new ForumCategoryModel({
        id: nextId,
        name: categoryData.name,
        description: categoryData.description || '',
        order: categoryData.order || 0,
        createdAt: now
      });
      
      await newCategory.save();
      
      return {
        id: nextId,
        name: categoryData.name,
        description: categoryData.description,
        order: categoryData.order || 0,
        createdAt: now
      };
    } catch (error) {
      console.error('Error creating forum category:', error);
      throw error;
    }
  }
  
  async getForumTopics(categoryId: number, page = 1, limit = 20): Promise<ForumTopic[]> {
    try {
      await this.connect();
      const skip = (page - 1) * limit;
      
      const topics = await ForumTopicModel.find({ categoryId })
        .sort({ isPinned: -1, lastReplyAt: -1 })
        .skip(skip)
        .limit(limit);
      
      return topics.map(topic => ({
        id: topic.id,
        categoryId: topic.categoryId,
        userId: topic.userId,
        title: topic.title,
        content: topic.content,
        views: topic.views,
        isPinned: topic.isPinned,
        isLocked: topic.isLocked,
        lastReplyAt: topic.lastReplyAt,
        createdAt: topic.createdAt
      }));
    } catch (error) {
      console.error('Error fetching forum topics:', error);
      return [];
    }
  }
  
  async getForumTopic(id: number): Promise<ForumTopic | undefined> {
    try {
      await this.connect();
      const topic = await ForumTopicModel.findOne({ id });
      if (!topic) return undefined;
      
      return {
        id: topic.id,
        categoryId: topic.categoryId,
        userId: topic.userId,
        title: topic.title,
        content: topic.content,
        views: topic.views,
        isPinned: topic.isPinned,
        isLocked: topic.isLocked,
        lastReplyAt: topic.lastReplyAt,
        createdAt: topic.createdAt
      };
    } catch (error) {
      console.error('Error fetching forum topic:', error);
      return undefined;
    }
  }
  
  async createForumTopic(topicData: InsertForumTopic): Promise<ForumTopic> {
    try {
      await this.connect();
      // Get highest ID or start with 1
      const highestTopic = await ForumTopicModel.findOne().sort('-id');
      const nextId = highestTopic ? highestTopic.id + 1 : 1;
      
      const now = new Date();
      const newTopic = new ForumTopicModel({
        id: nextId,
        categoryId: topicData.categoryId,
        userId: topicData.userId,
        title: topicData.title,
        content: topicData.content,
        views: 0,
        isPinned: false,
        isLocked: false,
        lastReplyAt: now,
        createdAt: now
      });
      
      await newTopic.save();
      
      return {
        id: nextId,
        categoryId: topicData.categoryId,
        userId: topicData.userId,
        title: topicData.title,
        content: topicData.content,
        views: 0,
        isPinned: false,
        isLocked: false,
        lastReplyAt: now,
        createdAt: now
      };
    } catch (error) {
      console.error('Error creating forum topic:', error);
      throw error;
    }
  }
  
  async incrementTopicViews(topicId: number): Promise<void> {
    try {
      await this.connect();
      await ForumTopicModel.updateOne(
        { id: topicId },
        { $inc: { views: 1 } }
      );
    } catch (error) {
      console.error('Error incrementing topic views:', error);
    }
  }
  
  async getForumReplies(topicId: number, page = 1, limit = 20): Promise<ForumReply[]> {
    try {
      await this.connect();
      const skip = (page - 1) * limit;
      
      const replies = await ForumReplyModel.find({ topicId })
        .sort('createdAt')
        .skip(skip)
        .limit(limit);
      
      return replies.map(reply => ({
        id: reply.id,
        topicId: reply.topicId,
        userId: reply.userId,
        content: reply.content,
        isEdited: reply.isEdited,
        createdAt: reply.createdAt,
        editedAt: reply.editedAt
      }));
    } catch (error) {
      console.error('Error fetching forum replies:', error);
      return [];
    }
  }
  
  async createForumReply(replyData: InsertForumReply): Promise<ForumReply> {
    try {
      await this.connect();
      // Get highest ID or start with 1
      const highestReply = await ForumReplyModel.findOne().sort('-id');
      const nextId = highestReply ? highestReply.id + 1 : 1;
      
      const now = new Date();
      const newReply = new ForumReplyModel({
        id: nextId,
        topicId: replyData.topicId,
        userId: replyData.userId,
        content: replyData.content,
        isEdited: false,
        createdAt: now
      });
      
      await newReply.save();
      
      // Update lastReplyAt in the topic
      await ForumTopicModel.updateOne(
        { id: replyData.topicId },
        { $set: { lastReplyAt: now } }
      );
      
      return {
        id: nextId,
        topicId: replyData.topicId,
        userId: replyData.userId,
        content: replyData.content,
        isEdited: false,
        createdAt: now
      };
    } catch (error) {
      console.error('Error creating forum reply:', error);
      throw error;
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
