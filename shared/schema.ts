import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").unique(),
  phone: text("phone"),
  avatar: text("avatar"),
  membershipType: text("membership_type").default("Basic"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow()
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  emailNotifications: boolean("email_notifications").default(true),
  priceAlerts: boolean("price_alerts").default(true),
  darkMode: boolean("dark_mode").default(false)
});

export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const watchlistItems = pgTable("watchlist_items", {
  id: serial("id").primaryKey(),
  watchlistId: integer("watchlist_id").notNull().references(() => watchlists.id),
  symbol: text("symbol").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  timestamp: timestamp("timestamp").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  emailNotifications: true,
  priceAlerts: true,
  darkMode: true
});

export const insertWatchlistSchema = createInsertSchema(watchlists).pick({
  userId: true,
  name: true
});

export const insertWatchlistItemSchema = createInsertSchema(watchlistItems).pick({
  watchlistId: true,
  symbol: true
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).pick({
  userId: true,
  symbol: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type Watchlist = typeof watchlists.$inferSelect;
export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type SearchHistory = typeof searchHistory.$inferSelect;
