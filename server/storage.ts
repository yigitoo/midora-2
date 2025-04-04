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
    
    const crypto = this.createForumCategoryInternal({
      name: "Cryptocurrency",
      description: "Discussions about Bitcoin, Ethereum, and other cryptocurrencies",
      order: 6
    });
    
    const beginners = this.createForumCategoryInternal({
      name: "Beginner's Corner",
      description: "New to investing? Ask your questions here",
      order: 7
    });

    // MARKET ANALYSIS TOPICS
    const topicMA1 = this.createForumTopicInternal({
      categoryId: markets.id,
      userId: 1,
      title: "S&P 500 Technical Analysis - April 2025",
      content: "I've been analyzing the S&P 500 chart patterns for April 2025 and noticed some interesting trends. The market seems to be forming a strong support level at 5,800. What are your thoughts on potential resistance levels for the coming weeks?",
      views: 142,
      isPinned: true,
      isLocked: false,
      lastReplyAt: new Date(),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    });
    
    const topicMA2 = this.createForumTopicInternal({
      categoryId: markets.id,
      userId: 1,
      title: "Bullish Divergence in Banking Sector",
      content: "Has anyone else noticed the potential bullish divergence forming in the banking sector? The XLF ETF is showing some interesting patterns on the RSI indicator that might signal a reversal from the recent downtrend. Thoughts?",
      views: 76,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    });
    
    const topicMA3 = this.createForumTopicInternal({
      categoryId: markets.id,
      userId: 1,
      title: "Volatility Index (VIX) Approaching 5-Year Lows",
      content: "The VIX is currently approaching 5-year lows at around 12. Historically, this has often preceded market corrections. Are you adjusting your portfolios in anticipation of increased volatility?",
      views: 113,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    });
    
    const topicMA4 = this.createForumTopicInternal({
      categoryId: markets.id,
      userId: 1,
      title: "Double Top Forming on DJIA?",
      content: "The Dow Jones Industrial Average appears to be forming a double top pattern. If confirmed, this could signal a trend reversal. Has anyone else spotted this, and what technical indicators are you using to confirm?",
      views: 92,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
    });

    // ECONOMICS & GLOBAL MARKETS TOPICS
    const topicEcon1 = this.createForumTopicInternal({
      categoryId: economics.id,
      userId: 1,
      title: "Impact of Recent Fed Policy on Emerging Markets",
      content: "The Federal Reserve's recent policy shift seems to be having significant effects on emerging market currencies and equities. I'm particularly watching Indonesia and Brazil. What markets are you monitoring, and what trends are you seeing?",
      views: 89,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    });
    
    const topicEcon2 = this.createForumTopicInternal({
      categoryId: economics.id,
      userId: 1,
      title: "European Central Bank's New Monetary Strategy",
      content: "The ECB has announced a new monetary strategy that seems to be allowing for higher inflation targets. How might this affect European equities and the Euro in the long term?",
      views: 105,
      isPinned: true,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });
    
    const topicEcon3 = this.createForumTopicInternal({
      categoryId: economics.id,
      userId: 1,
      title: "China's GDP Growth Projections for 2025-2026",
      content: "According to recent reports, China's projected GDP growth for 2025-2026 has been revised downward to 4.5%. This is lower than previous forecasts. What might this mean for global supply chains and commodity prices?",
      views: 78,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });

    // FINANCIAL NEWS TOPICS
    const topicNews1 = this.createForumTopicInternal({
      categoryId: news.id,
      userId: 1,
      title: "Breaking: Major Merger Announced in Pharmaceuticals",
      content: "Two of the largest pharmaceutical companies just announced a $65 billion merger. This could reshape the entire industry. What are your thoughts on potential investment opportunities or risks resulting from this?",
      views: 156,
      isPinned: true,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });
    
    const topicNews2 = this.createForumTopicInternal({
      categoryId: news.id,
      userId: 1,
      title: "New Regulations Coming for Fintech Industry",
      content: "Regulatory bodies have announced new frameworks for fintech companies, especially those involved in payment processing and cryptocurrencies. This could significantly impact companies like Square, PayPal, and Coinbase.",
      views: 112,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });

    // TRADING STRATEGIES TOPICS
    const topicStrat1 = this.createForumTopicInternal({
      categoryId: strategies.id,
      userId: 1,
      title: "Backtesting Results: Moving Average Crossover Strategy",
      content: "I've been backtesting a moving average crossover strategy using 50-day and 200-day EMAs on the S&P 500 since 2010. The results show a 9.8% annual return with a 12% drawdown. I'll share my detailed methodology if anyone's interested.",
      views: 203,
      isPinned: true,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    });
    
    const topicStrat2 = this.createForumTopicInternal({
      categoryId: strategies.id,
      userId: 1,
      title: "Options Wheel Strategy Performance",
      content: "For the past 6 months, I've been implementing the 'wheel strategy' (selling puts, then covered calls if assigned) on blue-chip stocks. My annualized return is around 15%, but I'm concerned about tail risk. Has anyone else used this strategy through a market downturn?",
      views: 178,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
    });
    
    const topicStrat3 = this.createForumTopicInternal({
      categoryId: strategies.id,
      userId: 1,
      title: "Sector Rotation Strategy Based on Economic Cycles",
      content: "I'm developing a sector rotation strategy based on economic cycles, moving between defensive and cyclical sectors. Does anyone have experience with this approach? What indicators do you use to time sector shifts?",
      views: 134,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    });

    // TECHNOLOGY STOCKS TOPICS
    const topicTech1 = this.createForumTopicInternal({
      categoryId: tech.id,
      userId: 1,
      title: "AI Companies Growth Potential",
      content: "I'm looking at several AI-focused companies that have shown strong growth over the past year. Companies like NVIDIA, Microsoft, and Google have made significant investments in AI. Which AI stocks do you think have the biggest growth potential for the next 5 years?",
      views: 228,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });
    
    const topicTech2 = this.createForumTopicInternal({
      categoryId: tech.id,
      userId: 1,
      title: "Semiconductor Shortage: Investment Implications",
      content: "The ongoing semiconductor shortage is affecting numerous industries. Which companies are best positioned to benefit, and which are most vulnerable? I'm particularly interested in smaller players that might be overlooked.",
      views: 194,
      isPinned: true,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    });
    
    const topicTech3 = this.createForumTopicInternal({
      categoryId: tech.id,
      userId: 1,
      title: "Evaluating Cloud Computing Companies",
      content: "I'm trying to evaluate which cloud computing companies offer the best investment opportunities. Beyond the obvious players (AWS, Azure, Google Cloud), are there any specialized cloud providers worth investigating?",
      views: 167,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
    });
    
    const topicTech4 = this.createForumTopicInternal({
      categoryId: tech.id,
      userId: 1,
      title: "Analysis of Apple's Recent Product Announcements",
      content: "Apple's recent product announcements seem to be focusing heavily on services rather than hardware innovation. How might this shift affect their revenue model and growth prospects going forward?",
      views: 153,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });

    // CRYPTOCURRENCY TOPICS
    const topicCrypto1 = this.createForumTopicInternal({
      categoryId: crypto.id,
      userId: 1,
      title: "Bitcoin Halving 2024: Price Implications",
      content: "With the Bitcoin halving approaching in 2024, what are your price predictions? Historically, halvings have preceded bull runs, but is this time different given the increased institutional involvement?",
      views: 287,
      isPinned: true,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });
    
    const topicCrypto2 = this.createForumTopicInternal({
      categoryId: crypto.id,
      userId: 1,
      title: "Ethereum's Transition to Proof-of-Stake",
      content: "Ethereum's complete transition to proof-of-stake seems to have reduced its energy consumption by over 99%. How might this affect its adoption and competitiveness against other smart contract platforms?",
      views: 241,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
    });
    
    const topicCrypto3 = this.createForumTopicInternal({
      categoryId: crypto.id,
      userId: 1,
      title: "Central Bank Digital Currencies (CBDCs) vs. Cryptocurrencies",
      content: "As more central banks announce CBDC initiatives, what might be the implications for decentralized cryptocurrencies? Will they coexist, or will CBDCs potentially replace some use cases for cryptocurrencies?",
      views: 198,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    });

    // BEGINNER'S CORNER TOPICS
    const topicBeg1 = this.createForumTopicInternal({
      categoryId: beginners.id,
      userId: 1,
      title: "Getting Started with Investing: Best Resources?",
      content: "I'm completely new to investing and want to start learning. What books, courses, or websites would you recommend for absolute beginners? I'm particularly interested in long-term investing strategies.",
      views: 324,
      isPinned: true,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    });
    
    const topicBeg2 = this.createForumTopicInternal({
      categoryId: beginners.id,
      userId: 1,
      title: "ETFs vs. Individual Stocks for New Investors",
      content: "As a new investor with about $5,000 to start with, should I focus on ETFs or try picking individual stocks? I understand ETFs offer more diversification, but individual stocks might offer higher returns. What's your advice?",
      views: 276,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });
    
    const topicBeg3 = this.createForumTopicInternal({
      categoryId: beginners.id,
      userId: 1,
      title: "Understanding P/E Ratios and Other Valuation Metrics",
      content: "I'm trying to understand how to value stocks using metrics like P/E ratios, P/B, and PEG. Can someone explain in simple terms what these metrics mean and how to use them to evaluate if a stock is overvalued or undervalued?",
      views: 245,
      isPinned: false,
      isLocked: false,
      lastReplyAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    });

    // Add sample replies to popular topics
    this.createForumReplyInternal({
      topicId: topicMA1.id,
      userId: 1,
      content: "Great analysis! I think we might see resistance at 6,000 based on previous patterns. The market has been quite bullish lately despite economic uncertainties.",
      isEdited: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      editedAt: undefined
    });
    
    this.createForumReplyInternal({
      topicId: topicMA1.id,
      userId: 1,
      content: "I've been tracking moving averages and we're well above the 200-day MA, which suggests continued upward momentum. However, I'm keeping an eye on the MACD for any signs of divergence.",
      isEdited: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      editedAt: undefined
    });
    
    this.createForumReplyInternal({
      topicId: topicMA1.id,
      userId: 1,
      content: "Don't forget to consider broader economic indicators. The yield curve suggests potential headwinds, and the upcoming earnings season might bring surprises that could test those support levels.",
      isEdited: false,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      editedAt: undefined
    });
    
    this.createForumReplyInternal({
      topicId: topicTech1.id,
      userId: 1,
      content: "NVIDIA seems well-positioned given their dominance in ML/AI chips. They're not just riding the AI wave but actively shaping it with their CUDA ecosystem.",
      isEdited: false,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      editedAt: undefined
    });
    
    this.createForumReplyInternal({
      topicId: topicTech1.id,
      userId: 1,
      content: "Don't overlook smaller players like Palantir and C3.ai that are focused on making AI accessible to enterprises. The picks-and-shovels approach might be less risky than betting on specific AI applications.",
      isEdited: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      editedAt: undefined
    });
    
    this.createForumReplyInternal({
      topicId: topicCrypto1.id,
      userId: 1,
      content: "Historical patterns suggest a potential price increase, but the growing institutional involvement might dampen volatility. We could see a more gradual appreciation rather than the explosive growth of previous cycles.",
      isEdited: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      editedAt: undefined
    });
    
    this.createForumReplyInternal({
      topicId: topicBeg1.id,
      userId: 1,
      content: "I'd recommend starting with 'The Intelligent Investor' by Benjamin Graham for fundamentals, though it's a bit dense. For a more accessible introduction, 'A Random Walk Down Wall Street' by Burton Malkiel is excellent.",
      isEdited: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      editedAt: undefined
    });
    
    this.createForumReplyInternal({
      topicId: topicBeg1.id,
      userId: 1,
      content: "Online resources like Investopedia are great for learning terminology. For practical experience without risking real money, try paper trading on platforms like ThinkOrSwim or the Midora simulation tool.",
      isEdited: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      editedAt: undefined
    });
    
    this.createForumReplyInternal({
      topicId: topicBeg1.id,
      userId: 1,
      content: "Don't forget about YouTube channels! Patrick Boyle, The Plain Bagel, and Ben Felix offer solid, evidence-based investing content without the hype you sometimes see in financial media.",
      isEdited: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
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
