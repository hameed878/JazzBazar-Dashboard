import { pgTable, serial, text, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const PACKAGES = {
  basic: { label: "Basic", price: 1500, dailyAds: 5 },
  standard: { label: "Standard", price: 4500, dailyAds: 10 },
  premium: { label: "Premium", price: 9500, dailyAds: 15 },
} as const;

export type PackageKey = keyof typeof PACKAGES;

// Fallback defaults — the live/admin-editable values are stored in the `settings` table
// and served via GET /api/config. These constants are only used to seed that row.
export const DEFAULT_AD_REWARD = 0.5; // USD per ad watched
export const DEFAULT_MIN_WITHDRAWAL = 20; // USD minimum withdrawal
export const DEFAULT_PAYMENT_ACCOUNT_NUMBER = "03448311279";
export const DEFAULT_PAYMENT_ACCOUNT_NAME = "JazzBazar Official";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  pkg: text("package").notNull(),
  paymentMethod: text("payment_method").notNull(),
  transactionImage: text("transaction_image").notNull(),
  status: text("status").notNull().default("pending"),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  adsWatchedToday: integer("ads_watched_today").notNull().default(0),
  lastAdDate: text("last_ad_date"),
  totalAdsWatched: integer("total_ads_watched").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: text("method").notNull().default("jazzcash"),
  accountNumber: text("account_number").notNull().default(""),
  accountName: text("account_name").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  brand: text("brand").notNull(),
  category: text("category").notNull().default("General"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull().default(""),
  duration: integer("duration").notNull().default(15),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  status: true,
  balance: true,
  adsWatchedToday: true,
  lastAdDate: true,
  totalAdsWatched: true,
  isAdmin: true,
  isBanned: true,
  createdAt: true,
  transactionImage: true,
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  phone: z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  pkg: z.enum(["basic", "standard", "premium"]),
  paymentMethod: z.enum(["jazzcash", "easypaisa"]),
});

export const loginSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export const withdrawSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["jazzcash", "easypaisa"]),
  accountNumber: z.string().min(6, "Enter a valid account number"),
  accountName: z.string().min(2, "Enter the account holder's name"),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(3).optional(),
  pkg: z.enum(["basic", "standard", "premium"]).optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  balance: z.number().min(0).optional(),
  adsWatchedToday: z.number().min(0).optional(),
  isBanned: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export const adConfigSchema = z.object({
  title: z.string().min(2),
  brand: z.string().min(1),
  category: z.string().min(1),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().optional().default(""),
  duration: z.number().min(3).max(120),
  active: z.boolean().optional(),
});

export interface AppConfig {
  jazzcashNumber: string;
  easypaisaNumber: string;
  accountName: string;
  adReward: number;
  minWithdrawal: number;
  packages: Record<PackageKey, { label: string; price: number; dailyAds: number }>;
}

export const DEFAULT_CONFIG: AppConfig = {
  jazzcashNumber: DEFAULT_PAYMENT_ACCOUNT_NUMBER,
  easypaisaNumber: DEFAULT_PAYMENT_ACCOUNT_NUMBER,
  accountName: DEFAULT_PAYMENT_ACCOUNT_NAME,
  adReward: DEFAULT_AD_REWARD,
  minWithdrawal: DEFAULT_MIN_WITHDRAWAL,
  packages: PACKAGES,
};

export const configUpdateSchema = z.object({
  jazzcashNumber: z.string().min(5).optional(),
  easypaisaNumber: z.string().min(5).optional(),
  accountName: z.string().min(2).optional(),
  adReward: z.number().positive().optional(),
  minWithdrawal: z.number().positive().optional(),
  packages: z
    .record(
      z.enum(["basic", "standard", "premium"]),
      z.object({
        label: z.string().min(1),
        price: z.number().positive(),
        dailyAds: z.number().positive(),
      }),
    )
    .optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type Ad = typeof ads.$inferSelect;
export type SafeUser = Omit<User, "password">;
