import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import mongoose from 'mongoose';

// MongoDB schema definitions
const UserSchema = new mongoose.Schema({
  id: Number,
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, sparse: true },
  phone: String,
  avatar: String,
  membershipType: { type: String, default: "Basic" },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  createdAt: { type: Date, default: Date.now }
});

const UserPreferencesSchema = new mongoose.Schema({
  id: Number,
  userId: { type: Number, required: true },
  emailNotifications: { type: Boolean, default: true },
  priceAlerts: { type: Boolean, default: true },
  darkMode: { type: Boolean, default: false }
});

const WatchlistSchema = new mongoose.Schema({
  id: Number,
  userId: { type: Number, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const WatchlistItemSchema = new mongoose.Schema({
  id: Number,
  watchlistId: { type: Number, required: true },
  symbol: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SearchHistorySchema = new mongoose.Schema({
  id: Number,
  userId: { type: Number, required: true },
  symbol: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ForumCategorySchema = new mongoose.Schema({
  id: Number,
  name: { type: String, required: true },
  description: String,
  order: { type: Number, default: 0 },
  parentId: { type: Number, default: null }, // null means it's a top-level category
  isSubcategory: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const ForumTopicSchema = new mongoose.Schema({
  id: Number,
  categoryId: { type: Number, required: true },
  userId: { type: Number, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  views: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  lastReplyAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const ForumReplySchema = new mongoose.Schema({
  id: Number,
  topicId: { type: Number, required: true },
  userId: { type: Number, required: true },
  content: { type: String, required: true },
  isEdited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  editedAt: Date
});

// Create and export the mongoose models
export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const UserPreferencesModel = mongoose.models.UserPreferences || mongoose.model('UserPreferences', UserPreferencesSchema);
export const WatchlistModel = mongoose.models.Watchlist || mongoose.model('Watchlist', WatchlistSchema);
export const WatchlistItemModel = mongoose.models.WatchlistItem || mongoose.model('WatchlistItem', WatchlistItemSchema);
export const SearchHistoryModel = mongoose.models.SearchHistory || mongoose.model('SearchHistory', SearchHistorySchema);
export const ForumCategoryModel = mongoose.models.ForumCategory || mongoose.model('ForumCategory', ForumCategorySchema);
export const ForumTopicModel = mongoose.models.ForumTopic || mongoose.model('ForumTopic', ForumTopicSchema);
export const ForumReplyModel = mongoose.models.ForumReply || mongoose.model('ForumReply', ForumReplySchema);

// These export constants are needed for compatibility with existing code
// but they're just placeholders for the MongoDB models
export const users = {
  id: "id",
  username: "username",
  password: "password",
  firstName: "firstName",
  lastName: "lastName",
  email: "email",
  phone: "phone",
  avatar: "avatar",
  membershipType: "membershipType",
  stripeCustomerId: "stripeCustomerId", 
  stripeSubscriptionId: "stripeSubscriptionId",
  createdAt: "createdAt"
};

export const userPreferences = {
  id: "id",
  userId: "userId",
  emailNotifications: "emailNotifications",
  priceAlerts: "priceAlerts",
  darkMode: "darkMode"
};

export const watchlists = {
  id: "id",
  userId: "userId",
  name: "name",
  createdAt: "createdAt"
};

export const watchlistItems = {
  id: "id",
  watchlistId: "watchlistId",
  symbol: "symbol",
  createdAt: "createdAt"
};

export const searchHistory = {
  id: "id",
  userId: "userId",
  symbol: "symbol",
  timestamp: "timestamp"
};

export const forumCategories = {
  id: "id",
  name: "name",
  description: "description",
  order: "order",
  parentId: "parentId",
  isSubcategory: "isSubcategory",
  createdAt: "createdAt"
};

export const forumTopics = {
  id: "id",
  categoryId: "categoryId",
  userId: "userId",
  title: "title",
  content: "content",
  views: "views",
  isPinned: "isPinned",
  isLocked: "isLocked",
  lastReplyAt: "lastReplyAt",
  createdAt: "createdAt"
};

export const forumReplies = {
  id: "id",
  topicId: "topicId",
  userId: "userId",
  content: "content",
  isEdited: "isEdited",
  createdAt: "createdAt",
  editedAt: "editedAt"
};

// Define Zod schemas directly since we're not using Drizzle ORM with MongoDB
export const insertUserSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional()
});

export const insertUserPreferencesSchema = z.object({
  userId: z.number(),
  emailNotifications: z.boolean().default(true),
  priceAlerts: z.boolean().default(true),
  darkMode: z.boolean().default(false)
});

export const insertWatchlistSchema = z.object({
  userId: z.number(),
  name: z.string().min(1)
});

export const insertWatchlistItemSchema = z.object({
  watchlistId: z.number(),
  symbol: z.string().min(1)
});

export const insertSearchHistorySchema = z.object({
  userId: z.number(),
  symbol: z.string().min(1)
});

export const insertForumCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number().default(0),
  parentId: z.number().nullable().optional(),
  isSubcategory: z.boolean().default(false)
});

export const insertForumTopicSchema = z.object({
  categoryId: z.number(),
  userId: z.number(),
  title: z.string().min(3).max(100),
  content: z.string().min(10)
});

export const insertForumReplySchema = z.object({
  topicId: z.number(),
  userId: z.number(),
  content: z.string().min(1)
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertForumCategory = z.infer<typeof insertForumCategorySchema>;
export type InsertForumTopic = z.infer<typeof insertForumTopicSchema>;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;

// These types need to be defined manually since we're not using Drizzle's $inferSelect
export type User = {
  id: number;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  membershipType: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
};

export type UserPreferences = {
  id: number;
  userId: number;
  emailNotifications: boolean;
  priceAlerts: boolean;
  darkMode: boolean;
};

export type Watchlist = {
  id: number;
  userId: number;
  name: string;
  createdAt: Date;
};

export type WatchlistItem = {
  id: number;
  watchlistId: number;
  symbol: string;
  createdAt: Date;
};

export type SearchHistory = {
  id: number;
  userId: number;
  symbol: string;
  timestamp: Date;
};

export type ForumCategory = {
  id: number;
  name: string;
  description?: string;
  order: number;
  parentId?: number | null;
  isSubcategory?: boolean;
  createdAt: Date;
};

export type ForumTopic = {
  id: number;
  categoryId: number;
  userId: number;
  title: string;
  content: string;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  lastReplyAt: Date;
  createdAt: Date;
};

export type ForumReply = {
  id: number;
  topicId: number;
  userId: number;
  content: string;
  isEdited: boolean;
  createdAt: Date;
  editedAt?: Date;
};
