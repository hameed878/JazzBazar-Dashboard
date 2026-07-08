import { pgTable, serial, text, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const PACKAGES = {
  basic: { label: "Basic", price: 1500, dailyAds: 5 },
  standard: { label: "Standard", price: 4500, dailyAds: 10 },
  premium: { label: "Premium", price: 9500, dailyAds: 15 },
} as const;

export type PackageKey = keyof typeof PACKAGES;

export const AD_REWARD = 25;

export const PAYMENT_ACCOUNT_NUMBER = "03448311279";
export const PAYMENT_ACCOUNT_NAME = "JazzBazar Official";

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
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  status: true,
  balance: true,
  adsWatchedToday: true,
  lastAdDate: true,
  isAdmin: true,
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

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type SafeUser = Omit<User, "password">;
