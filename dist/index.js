var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  DEFAULT_AD_REWARD: () => DEFAULT_AD_REWARD,
  DEFAULT_CONFIG: () => DEFAULT_CONFIG,
  DEFAULT_MIN_WITHDRAWAL: () => DEFAULT_MIN_WITHDRAWAL,
  DEFAULT_PAYMENT_ACCOUNT_NAME: () => DEFAULT_PAYMENT_ACCOUNT_NAME,
  DEFAULT_PAYMENT_ACCOUNT_NUMBER: () => DEFAULT_PAYMENT_ACCOUNT_NUMBER,
  PACKAGES: () => PACKAGES,
  adConfigSchema: () => adConfigSchema,
  adminUpdateUserSchema: () => adminUpdateUserSchema,
  ads: () => ads,
  configUpdateSchema: () => configUpdateSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  settings: () => settings,
  signupSchema: () => signupSchema,
  users: () => users,
  withdrawSchema: () => withdrawSchema,
  withdrawals: () => withdrawals
});
import { pgTable, serial, text, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var PACKAGES, DEFAULT_AD_REWARD, DEFAULT_MIN_WITHDRAWAL, DEFAULT_PAYMENT_ACCOUNT_NUMBER, DEFAULT_PAYMENT_ACCOUNT_NAME, users, withdrawals, ads, settings, insertUserSchema, signupSchema, loginSchema, withdrawSchema, adminUpdateUserSchema, adConfigSchema, DEFAULT_CONFIG, configUpdateSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    PACKAGES = {
      basic: { label: "Basic", price: 1500, dailyAds: 5 },
      standard: { label: "Standard", price: 4500, dailyAds: 10 },
      premium: { label: "Premium", price: 9500, dailyAds: 15 }
    };
    DEFAULT_AD_REWARD = 0.5;
    DEFAULT_MIN_WITHDRAWAL = 20;
    DEFAULT_PAYMENT_ACCOUNT_NUMBER = "03448311279";
    DEFAULT_PAYMENT_ACCOUNT_NAME = "JazzBazar Official";
    users = pgTable("users", {
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
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    withdrawals = pgTable("withdrawals", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull(),
      amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
      method: text("method").notNull().default("jazzcash"),
      accountNumber: text("account_number").notNull().default(""),
      accountName: text("account_name").notNull().default(""),
      status: text("status").notNull().default("pending"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    ads = pgTable("ads", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      brand: text("brand").notNull(),
      category: text("category").notNull().default("General"),
      videoUrl: text("video_url").notNull(),
      thumbnailUrl: text("thumbnail_url").notNull().default(""),
      duration: integer("duration").notNull().default(15),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    settings = pgTable("settings", {
      key: text("key").primaryKey(),
      value: text("value").notNull()
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      status: true,
      balance: true,
      adsWatchedToday: true,
      lastAdDate: true,
      totalAdsWatched: true,
      isAdmin: true,
      isBanned: true,
      createdAt: true,
      transactionImage: true
    });
    signupSchema = z.object({
      name: z.string().min(2, "Name is too short"),
      phone: z.string().min(10, "Enter a valid phone number"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      pkg: z.enum(["basic", "standard", "premium"]),
      paymentMethod: z.enum(["jazzcash", "easypaisa"])
    });
    loginSchema = z.object({
      phone: z.string().min(1, "Phone number is required"),
      password: z.string().min(1, "Password is required")
    });
    withdrawSchema = z.object({
      amount: z.number().positive(),
      method: z.enum(["jazzcash", "easypaisa"]),
      accountNumber: z.string().min(6, "Enter a valid account number"),
      accountName: z.string().min(2, "Enter the account holder's name")
    });
    adminUpdateUserSchema = z.object({
      name: z.string().min(2).optional(),
      phone: z.string().min(3).optional(),
      pkg: z.enum(["basic", "standard", "premium"]).optional(),
      status: z.enum(["pending", "approved", "rejected"]).optional(),
      balance: z.number().min(0).optional(),
      adsWatchedToday: z.number().min(0).optional(),
      isBanned: z.boolean().optional(),
      password: z.string().min(6).optional()
    });
    adConfigSchema = z.object({
      title: z.string().min(2),
      brand: z.string().min(1),
      category: z.string().min(1),
      videoUrl: z.string().url(),
      thumbnailUrl: z.string().optional().default(""),
      duration: z.number().min(3).max(120),
      active: z.boolean().optional()
    });
    DEFAULT_CONFIG = {
      jazzcashNumber: DEFAULT_PAYMENT_ACCOUNT_NUMBER,
      easypaisaNumber: DEFAULT_PAYMENT_ACCOUNT_NUMBER,
      accountName: DEFAULT_PAYMENT_ACCOUNT_NAME,
      adReward: DEFAULT_AD_REWARD,
      minWithdrawal: DEFAULT_MIN_WITHDRAWAL,
      packages: PACKAGES
    };
    configUpdateSchema = z.object({
      jazzcashNumber: z.string().min(5).optional(),
      easypaisaNumber: z.string().min(5).optional(),
      accountName: z.string().min(2).optional(),
      adReward: z.number().positive().optional(),
      minWithdrawal: z.number().positive().optional(),
      packages: z.record(
        z.enum(["basic", "standard", "premium"]),
        z.object({
          label: z.string().min(1),
          price: z.number().positive(),
          dailyAds: z.number().positive()
        })
      ).optional()
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool
});
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var connectionString, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    connectionString = process.env.NEON_DATABASE_URL;
    if (!connectionString) {
      throw new Error("NEON_DATABASE_URL environment variable is not set");
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    db = drizzle(pool, { schema: schema_exports });
  }
});

// server/index.ts
import express2 from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// server/routes.ts
import { createServer } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

// server/storage.ts
init_db();
init_schema();
import { eq, desc } from "drizzle-orm";
var storage = {
  async getUserByPhone(phone) {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  },
  async getUserById(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },
  async createUser(input) {
    const [user] = await db.insert(users).values({
      name: input.name,
      phone: input.phone,
      password: input.password,
      pkg: input.pkg,
      paymentMethod: input.paymentMethod,
      transactionImage: input.transactionImage
    }).returning();
    return user;
  },
  async getAllUsers() {
    return db.select().from(users).orderBy(desc(users.createdAt));
  },
  async updateUserStatus(id, status) {
    const [user] = await db.update(users).set({ status }).where(eq(users.id, id)).returning();
    return user;
  },
  async updateAdsWatched(id, adsWatchedToday, lastAdDate, newBalance, totalAdsWatched) {
    const [user] = await db.update(users).set({ adsWatchedToday, lastAdDate, balance: newBalance, totalAdsWatched }).where(eq(users.id, id)).returning();
    return user;
  },
  async deductBalance(id, newBalance) {
    const [user] = await db.update(users).set({ balance: newBalance }).where(eq(users.id, id)).returning();
    return user;
  },
  async adminUpdateUser(id, patch) {
    const [user] = await db.update(users).set(patch).where(eq(users.id, id)).returning();
    return user;
  },
  async deleteUser(id) {
    await db.delete(withdrawals).where(eq(withdrawals.userId, id));
    await db.delete(users).where(eq(users.id, id));
  },
  async createWithdrawal(input) {
    const [withdrawal] = await db.insert(withdrawals).values(input).returning();
    return withdrawal;
  },
  async getWithdrawalsByUser(userId) {
    return db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt));
  },
  async getAllWithdrawals() {
    return db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
  },
  async updateWithdrawalStatus(id, status) {
    const [withdrawal] = await db.update(withdrawals).set({ status }).where(eq(withdrawals.id, id)).returning();
    return withdrawal;
  },
  async getSetting(key) {
    const [row] = await db.select().from(settings).where(eq(settings.key, key));
    return row?.value;
  },
  async setSetting(key, value) {
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  },
  async getAllAds() {
    return db.select().from(ads).orderBy(desc(ads.createdAt));
  },
  async getActiveAds() {
    return db.select().from(ads).where(eq(ads.active, true)).orderBy(desc(ads.createdAt));
  },
  async createAd(input) {
    const [ad] = await db.insert(ads).values(input).returning();
    return ad;
  },
  async updateAd(id, patch) {
    const [ad] = await db.update(ads).set(patch).where(eq(ads.id, id)).returning();
    return ad;
  },
  async deleteAd(id) {
    await db.delete(ads).where(eq(ads.id, id));
  }
};

// server/config.ts
init_schema();
var CONFIG_KEY = "app_config";
async function getConfig() {
  const raw = await storage.getSetting(CONFIG_KEY);
  if (!raw) {
    await storage.setSetting(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  }
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed, packages: { ...DEFAULT_CONFIG.packages, ...parsed.packages || {} } };
  } catch {
    return DEFAULT_CONFIG;
  }
}
async function updateConfig(patch) {
  const current = await getConfig();
  const next = {
    ...current,
    ...patch,
    packages: { ...current.packages, ...patch.packages || {} }
  };
  await storage.setSetting(CONFIG_KEY, JSON.stringify(next));
  return next;
}

// server/routes.ts
init_schema();
import { fromZodError } from "zod-validation-error";
var uploadsDir = path.join(process.cwd(), "server", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
var upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  }
});
function toSafeUser(user) {
  const { password, ...safe } = user;
  return safe;
}
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.status(401).json({ message: "Admin access required" });
  }
  next();
}
function todayStr() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
async function registerRoutes(app2) {
  app2.use("/uploads", requireAdmin, (await import("express")).default.static(uploadsDir));
  app2.get("/api/config", async (_req, res) => {
    const config = await getConfig();
    res.json(config);
  });
  app2.post("/api/auth/signup", upload.single("transactionImage"), async (req, res) => {
    try {
      const parsed = signupSchema.safeParse({
        name: req.body.name,
        phone: req.body.phone,
        password: req.body.password,
        pkg: req.body.pkg,
        paymentMethod: req.body.paymentMethod
      });
      if (!parsed.success) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: fromZodError(parsed.error).message });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Transaction screenshot is required" });
      }
      const existing = await storage.getUserByPhone(parsed.data.phone);
      if (existing) {
        fs.unlinkSync(req.file.path);
        return res.status(409).json({ message: "An account with this phone number already exists" });
      }
      const hashed = await bcrypt.hash(parsed.data.password, 10);
      const user = await storage.createUser({
        name: parsed.data.name,
        phone: parsed.data.phone,
        password: hashed,
        pkg: parsed.data.pkg,
        paymentMethod: parsed.data.paymentMethod,
        transactionImage: `/uploads/${req.file.filename}`
      });
      req.session.userId = user.id;
      req.session.isAdmin = false;
      await new Promise(
        (resolve, reject) => req.session.save((err) => err ? reject(err) : resolve())
      );
      res.status(201).json({ user: toSafeUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Something went wrong during signup" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: fromZodError(parsed.error).message });
      }
      const user = await storage.getUserByPhone(parsed.data.phone);
      if (!user) {
        return res.status(401).json({ message: "Invalid phone number or password" });
      }
      if (user.isBanned) {
        return res.status(403).json({ message: "Your account has been suspended. Contact support." });
      }
      const match = await bcrypt.compare(parsed.data.password, user.password);
      if (!match) {
        return res.status(401).json({ message: "Invalid phone number or password" });
      }
      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;
      await new Promise(
        (resolve, reject) => req.session.save((err) => err ? reject(err) : resolve())
      );
      res.json({ user: toSafeUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Something went wrong during login" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });
  app2.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user: toSafeUser(user) });
  });
  app2.get("/api/ads", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    const activeAds = await storage.getActiveAds();
    const sorted = [...activeAds].sort((a, b) => a.id - b.id);
    const planLimit = { basic: 5, standard: 10, premium: 15 };
    const limit = planLimit[user.pkg] ?? sorted.length;
    res.json({ ads: sorted.slice(0, limit) });
  });
  app2.post("/api/ads/watch", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    if (user.status !== "approved") {
      return res.status(403).json({ message: "Your account is pending admin verification" });
    }
    const config = await getConfig();
    const dailyLimit = config.packages[user.pkg]?.dailyAds ?? 0;
    const today = todayStr();
    const watchedToday = user.lastAdDate === today ? user.adsWatchedToday : 0;
    if (watchedToday >= dailyLimit) {
      return res.status(400).json({ message: "Daily ad limit reached. Come back tomorrow!" });
    }
    const newBalance = (parseFloat(user.balance) + config.adReward).toFixed(2);
    const updated = await storage.updateAdsWatched(user.id, watchedToday + 1, today, newBalance, user.totalAdsWatched + 1);
    res.json({ user: toSafeUser(updated), reward: config.adReward });
  });
  app2.post("/api/withdraw", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    if (user.status !== "approved") {
      return res.status(403).json({ message: "Your account is pending admin verification" });
    }
    const parsed = withdrawSchema.safeParse({
      amount: parseFloat(req.body.amount),
      method: req.body.method,
      accountNumber: req.body.accountNumber,
      accountName: req.body.accountName
    });
    if (!parsed.success) {
      return res.status(400).json({ message: fromZodError(parsed.error).message });
    }
    const { amount, method, accountNumber, accountName } = parsed.data;
    const config = await getConfig();
    const balance = parseFloat(user.balance);
    if (amount > balance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    if (amount < config.minWithdrawal) {
      return res.status(400).json({ message: `Minimum withdrawal amount is $${config.minWithdrawal}` });
    }
    const newBalance = (balance - amount).toFixed(2);
    await storage.deductBalance(user.id, newBalance);
    const withdrawal = await storage.createWithdrawal({
      userId: user.id,
      amount: amount.toFixed(2),
      method,
      accountNumber,
      accountName
    });
    res.json({ withdrawal, balance: newBalance });
  });
  app2.get("/api/withdrawals", requireAuth, async (req, res) => {
    const withdrawals2 = await storage.getWithdrawalsByUser(req.session.userId);
    res.json({ withdrawals: withdrawals2 });
  });
  app2.post("/api/admin/login", async (req, res) => {
    const { phone, password } = req.body;
    const user = await storage.getUserByPhone(phone);
    if (!user || !user.isAdmin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }
    req.session.userId = user.id;
    req.session.isAdmin = true;
    await new Promise(
      (resolve, reject) => req.session.save((err) => err ? reject(err) : resolve())
    );
    res.json({ user: toSafeUser(user) });
  });
  app2.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    const allUsers = await storage.getAllUsers();
    const allWithdrawals = await storage.getAllWithdrawals();
    const config = await getConfig();
    const normalUsers = allUsers.filter((u) => !u.isAdmin);
    const totalDeposits = normalUsers.reduce((sum, u) => sum + (config.packages[u.pkg]?.price ?? 0), 0);
    const approvedDeposits = normalUsers.filter((u) => u.status === "approved").reduce((sum, u) => sum + (config.packages[u.pkg]?.price ?? 0), 0);
    res.json({
      totalUsers: normalUsers.length,
      pendingUsers: normalUsers.filter((u) => u.status === "pending").length,
      approvedUsers: normalUsers.filter((u) => u.status === "approved").length,
      rejectedUsers: normalUsers.filter((u) => u.status === "rejected").length,
      bannedUsers: normalUsers.filter((u) => u.isBanned).length,
      totalBalance: normalUsers.reduce((sum, u) => sum + parseFloat(u.balance), 0),
      totalAdsWatched: normalUsers.reduce((sum, u) => sum + u.totalAdsWatched, 0),
      totalDeposits,
      approvedDeposits,
      pendingWithdrawals: allWithdrawals.filter((w) => w.status === "pending").length,
      pendingWithdrawalAmount: allWithdrawals.filter((w) => w.status === "pending").reduce((s, w) => s + parseFloat(w.amount), 0),
      paidWithdrawalAmount: allWithdrawals.filter((w) => w.status === "approved").reduce((s, w) => s + parseFloat(w.amount), 0)
    });
  });
  app2.get("/api/admin/users", requireAdmin, async (_req, res) => {
    const allUsers = await storage.getAllUsers();
    res.json({ users: allUsers.map(toSafeUser) });
  });
  app2.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const parsed = adminUpdateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: fromZodError(parsed.error).message });
    }
    const { balance, password, ...rest } = parsed.data;
    const patch = { ...rest };
    if (balance !== void 0) patch.balance = balance.toFixed(2);
    if (password) patch.password = await bcrypt.hash(password, 10);
    if (patch.phone) {
      const existing = await storage.getUserByPhone(patch.phone);
      if (existing && existing.id !== parseInt(req.params.id)) {
        return res.status(409).json({ message: "Phone number already in use" });
      }
    }
    const user = await storage.adminUpdateUser(parseInt(req.params.id), patch);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: toSafeUser(user) });
  });
  app2.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const user = await storage.getUserById(parseInt(req.params.id));
    if (user?.isAdmin) {
      return res.status(400).json({ message: "Cannot delete an admin account" });
    }
    await storage.deleteUser(parseInt(req.params.id));
    res.json({ message: "User deleted" });
  });
  app2.post("/api/admin/users/:id/approve", requireAdmin, async (req, res) => {
    const user = await storage.updateUserStatus(parseInt(req.params.id), "approved");
    res.json({ user: user ? toSafeUser(user) : null });
  });
  app2.post("/api/admin/users/:id/reject", requireAdmin, async (req, res) => {
    const user = await storage.updateUserStatus(parseInt(req.params.id), "rejected");
    res.json({ user: user ? toSafeUser(user) : null });
  });
  app2.get("/api/admin/withdrawals", requireAdmin, async (_req, res) => {
    const withdrawals2 = await storage.getAllWithdrawals();
    const allUsers = await storage.getAllUsers();
    const userMap = new Map(allUsers.map((u) => [u.id, toSafeUser(u)]));
    res.json({ withdrawals: withdrawals2.map((w) => ({ ...w, user: userMap.get(w.userId) || null })) });
  });
  app2.post("/api/admin/withdrawals/:id/approve", requireAdmin, async (req, res) => {
    const withdrawal = await storage.updateWithdrawalStatus(parseInt(req.params.id), "approved");
    res.json({ withdrawal });
  });
  app2.post("/api/admin/withdrawals/:id/reject", requireAdmin, async (req, res) => {
    const withdrawal = await storage.getAllWithdrawals().then((ws) => ws.find((w) => w.id === parseInt(req.params.id)));
    const updated = await storage.updateWithdrawalStatus(parseInt(req.params.id), "rejected");
    if (updated && withdrawal) {
      const user = await storage.getUserById(withdrawal.userId);
      if (user) {
        const refunded = (parseFloat(user.balance) + parseFloat(withdrawal.amount)).toFixed(2);
        await storage.deductBalance(user.id, refunded);
      }
    }
    res.json({ withdrawal: updated });
  });
  app2.get("/api/admin/settings", requireAdmin, async (_req, res) => {
    const config = await getConfig();
    res.json(config);
  });
  app2.patch("/api/admin/settings", requireAdmin, async (req, res) => {
    const parsed = configUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: fromZodError(parsed.error).message });
    }
    const config = await updateConfig(parsed.data);
    res.json(config);
  });
  app2.get("/api/admin/ads", requireAdmin, async (_req, res) => {
    const allAds = await storage.getAllAds();
    res.json({ ads: allAds });
  });
  app2.post("/api/admin/ads", requireAdmin, async (req, res) => {
    const parsed = adConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: fromZodError(parsed.error).message });
    }
    const ad = await storage.createAd({ ...parsed.data, active: parsed.data.active ?? true });
    res.status(201).json({ ad });
  });
  app2.patch("/api/admin/ads/:id", requireAdmin, async (req, res) => {
    const parsed = adConfigSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: fromZodError(parsed.error).message });
    }
    const ad = await storage.updateAd(parseInt(req.params.id), parsed.data);
    if (!ad) return res.status(404).json({ message: "Ad not found" });
    res.json({ ad });
  });
  app2.delete("/api/admin/ads/:id", requireAdmin, async (req, res) => {
    await storage.deleteAd(parseInt(req.params.id));
    res.json({ message: "Ad deleted" });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "server", "public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true
  }
});

// server/vite.ts
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use(async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(import.meta.dirname, "..", "client", "index.html");
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${Date.now()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use((_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
init_db();
import bcrypt2 from "bcryptjs";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
var PgSession = connectPgSimple(session);
app.set("trust proxy", 1);
app.use(
  session({
    store: new PgSession({
      pool,
      createTableIfMissing: true,
      tableName: "session"
    }),
    secret: process.env.SESSION_SECRET || "jazzbazar-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1e3
    }
  })
);
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
var ADMIN_PHONE = "admin";
var ADMIN_PASSWORD = "Clear@Clear";
async function ensureAdminUser() {
  const existing = await storage.getUserByPhone(ADMIN_PHONE);
  if (!existing) {
    const hashed = await bcrypt2.hash(ADMIN_PASSWORD, 10);
    const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    await db2.insert(users2).values({
      name: "Administrator",
      phone: ADMIN_PHONE,
      password: hashed,
      pkg: "premium",
      paymentMethod: "jazzcash",
      transactionImage: "",
      status: "approved",
      isAdmin: true
    });
    log(`Seeded default admin account (phone: ${ADMIN_PHONE} / password: ${ADMIN_PASSWORD})`);
  } else {
    const stillLegacy = await bcrypt2.compare("jazzbazar786", existing.password);
    if (stillLegacy) {
      const hashed = await bcrypt2.hash(ADMIN_PASSWORD, 10);
      await storage.adminUpdateUser(existing.id, { password: hashed });
      log(`Updated admin password to new default (phone: ${ADMIN_PHONE} / password: ${ADMIN_PASSWORD})`);
    }
  }
}
async function ensureAds() {
  const existingAds = await storage.getAllAds();
  const titleToYouTube = {
    // Basic tier
    "Jazz \u2014 Pakistan Mein Sab Se Tez Network": "https://www.youtube.com/watch?v=ss2M1J9IFiA",
    "Ufone 4G \u2014 U Tou Babar Hai": "https://www.youtube.com/watch?v=D6fPrRaTwBE",
    "Telenor Pakistan \u2014 Zainab Ki Kahani": "https://www.youtube.com/watch?v=_u_naO4mWLc",
    "Surf Excel \u2014 KhushiyonKaSadqa Ramazan 2022": "https://www.youtube.com/watch?v=zTsBZMCq3a8",
    "NESCAF\xC9 Pakistan \u2014 Imkan Hai": "https://www.youtube.com/watch?v=VySzhAKpBew",
    // Standard tier
    "Ufone \u2014 Sohni Mahiwal Weekly Offer": "https://www.youtube.com/watch?v=O3SjrE7AmEw",
    "Knorr Pakistan \u2014 Nayi Duniya Ke Zaiqay": "https://www.youtube.com/watch?v=wy1tjUJX4f0",
    "MILO Pakistan \u2014 Fuel For School": "https://www.youtube.com/watch?v=JSl206o6mDU",
    "HBL \u2014 Islamic Personal Finance": "https://www.youtube.com/watch?v=dCK8bctt9EY",
    "Zong 4G \u2014 Business Solutions": "https://www.youtube.com/watch?v=BvsOcru1DPE",
    // Premium tier
    "Pepsi Pakistan \u2014 Khelenge Beat Pe (PSL 11)": "https://www.youtube.com/watch?v=DNd4nwMoUIM",
    "Surf Excel \u2014 Daag Ache Hain (Puddlewar)": "https://www.youtube.com/watch?v=6o6JJIkamVY",
    "Telenor Pakistan \u2014 Gaming Sim": "https://www.youtube.com/watch?v=5C4tZUKXEMo",
    "Shan Foods \u2014 Masala Cola": "https://www.youtube.com/watch?v=rJSieo5RNlU",
    "Nestl\xE9 Fruita Vitals \u2014 Taste of Pakistan": "https://www.youtube.com/watch?v=ZoMpagkhJTY",
    // Legacy placeholder titles → redirect to correct YouTube ads
    "Falak Mobile \u2014 Unlimited 4G Load Offer": "https://www.youtube.com/watch?v=ss2M1J9IFiA",
    "Zaiqa Chips \u2014 Crunch Into Flavor": "https://www.youtube.com/watch?v=O3SjrE7AmEw",
    "Bazaar Online \u2014 Shop Everything, Fast": "https://www.youtube.com/watch?v=wy1tjUJX4f0",
    "Sohni Textiles \u2014 New Winter Collection": "https://www.youtube.com/watch?v=zTsBZMCq3a8",
    "Speedy Riders \u2014 Delivered in 30 Minutes": "https://www.youtube.com/watch?v=VySzhAKpBew",
    "Karim's Kitchen \u2014 Taste of Home": "https://www.youtube.com/watch?v=wy1tjUJX4f0",
    "PakDrive \u2014 Find Your Dream Car": "https://www.youtube.com/watch?v=BvsOcru1DPE",
    "HealthPlus \u2014 Your Wellness Partner": "https://www.youtube.com/watch?v=JSl206o6mDU",
    "BrightStar Academy \u2014 Learn & Grow": "https://www.youtube.com/watch?v=dCK8bctt9EY",
    "GlowUp Cosmetics \u2014 Shine Every Day": "https://www.youtube.com/watch?v=rJSieo5RNlU",
    "SkyTravel \u2014 Fly Anywhere for Less": "https://www.youtube.com/watch?v=DNd4nwMoUIM",
    "CryptoEarn PK \u2014 Invest Smart": "https://www.youtube.com/watch?v=5C4tZUKXEMo",
    "LuxeHome \u2014 Furniture That Lasts": "https://www.youtube.com/watch?v=ZoMpagkhJTY",
    "ActiveGear PK \u2014 Sports Equipment Sale": "https://www.youtube.com/watch?v=6o6JJIkamVY",
    "TechZone \u2014 Gadgets at Best Price": "https://www.youtube.com/watch?v=D6fPrRaTwBE"
  };
  const fallbackYouTube = "https://www.youtube.com/watch?v=ss2M1J9IFiA";
  let migratedCount = 0;
  for (const ad of existingAds) {
    const byTitle = titleToYouTube[ad.title];
    const needsMigration = !ad.videoUrl.includes("youtube.com");
    const newVideoUrl = byTitle ?? (needsMigration ? fallbackYouTube : null);
    if (newVideoUrl && ad.videoUrl !== newVideoUrl) {
      await storage.updateAd(ad.id, { videoUrl: newVideoUrl });
      migratedCount++;
    }
  }
  if (migratedCount > 0) log(`Migrated ${migratedCount} ads to Pakistani brand YouTube videos`);
  if (existingAds.length >= 15) return;
  const allSeedAds = [
    // ── Basic tier (visible to all plans) ──
    {
      title: "Jazz \u2014 Pakistan Mein Sab Se Tez Network",
      brand: "Jazz",
      category: "Telecom",
      videoUrl: "https://www.youtube.com/watch?v=ss2M1J9IFiA",
      thumbnailUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
      duration: 30
    },
    {
      title: "Ufone 4G \u2014 U Tou Babar Hai",
      brand: "Ufone",
      category: "Telecom",
      videoUrl: "https://www.youtube.com/watch?v=D6fPrRaTwBE",
      thumbnailUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80",
      duration: 30
    },
    {
      title: "Telenor Pakistan \u2014 Zainab Ki Kahani",
      brand: "Telenor Pakistan",
      category: "Telecom",
      videoUrl: "https://www.youtube.com/watch?v=_u_naO4mWLc",
      thumbnailUrl: "https://images.unsplash.com/photo-1596077921836-4bab7fcf7e76?w=400&q=80",
      duration: 30
    },
    {
      title: "Surf Excel \u2014 KhushiyonKaSadqa Ramazan 2022",
      brand: "Surf Excel",
      category: "FMCG",
      videoUrl: "https://www.youtube.com/watch?v=zTsBZMCq3a8",
      thumbnailUrl: "https://images.unsplash.com/photo-1584545284372-f22510eb7c26?w=400&q=80",
      duration: 60
    },
    {
      title: "NESCAF\xC9 Pakistan \u2014 Imkan Hai",
      brand: "NESCAF\xC9 Pakistan",
      category: "Beverages",
      videoUrl: "https://www.youtube.com/watch?v=VySzhAKpBew",
      thumbnailUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
      duration: 30
    },
    // ── Standard tier (visible to Standard & Premium) ──
    {
      title: "Ufone \u2014 Sohni Mahiwal Weekly Offer",
      brand: "Ufone",
      category: "Telecom",
      videoUrl: "https://www.youtube.com/watch?v=O3SjrE7AmEw",
      thumbnailUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
      duration: 60
    },
    {
      title: "Knorr Pakistan \u2014 Nayi Duniya Ke Zaiqay",
      brand: "Knorr Pakistan",
      category: "Food",
      videoUrl: "https://www.youtube.com/watch?v=wy1tjUJX4f0",
      thumbnailUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80",
      duration: 30
    },
    {
      title: "MILO Pakistan \u2014 Fuel For School",
      brand: "MILO Pakistan",
      category: "Beverages",
      videoUrl: "https://www.youtube.com/watch?v=JSl206o6mDU",
      thumbnailUrl: "https://images.unsplash.com/photo-1559181567-c3190becdac5?w=400&q=80",
      duration: 30
    },
    {
      title: "HBL \u2014 Islamic Personal Finance",
      brand: "HBL",
      category: "Banking",
      videoUrl: "https://www.youtube.com/watch?v=dCK8bctt9EY",
      thumbnailUrl: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=400&q=80",
      duration: 30
    },
    {
      title: "Zong 4G \u2014 Business Solutions",
      brand: "Zong 4G",
      category: "Telecom",
      videoUrl: "https://www.youtube.com/watch?v=BvsOcru1DPE",
      thumbnailUrl: "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=400&q=80",
      duration: 30
    },
    // ── Premium tier (visible to Premium only) ──
    {
      title: "Pepsi Pakistan \u2014 Khelenge Beat Pe (PSL 11)",
      brand: "Pepsi Pakistan",
      category: "Beverages",
      videoUrl: "https://www.youtube.com/watch?v=DNd4nwMoUIM",
      thumbnailUrl: "https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=400&q=80",
      duration: 180
    },
    {
      title: "Surf Excel \u2014 Daag Ache Hain (Puddlewar)",
      brand: "Surf Excel",
      category: "FMCG",
      videoUrl: "https://www.youtube.com/watch?v=6o6JJIkamVY",
      thumbnailUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
      duration: 60
    },
    {
      title: "Telenor Pakistan \u2014 Gaming Sim",
      brand: "Telenor Pakistan",
      category: "Telecom",
      videoUrl: "https://www.youtube.com/watch?v=5C4tZUKXEMo",
      thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80",
      duration: 30
    },
    {
      title: "Shan Foods \u2014 Masala Cola",
      brand: "Shan Foods",
      category: "Food",
      videoUrl: "https://www.youtube.com/watch?v=rJSieo5RNlU",
      thumbnailUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80",
      duration: 30
    },
    {
      title: "Nestl\xE9 Fruita Vitals \u2014 Taste of Pakistan",
      brand: "Nestl\xE9 Pakistan",
      category: "Beverages",
      videoUrl: "https://www.youtube.com/watch?v=ZoMpagkhJTY",
      thumbnailUrl: "https://images.unsplash.com/photo-1560508180-03f285f67ded?w=400&q=80",
      duration: 30
    }
  ];
  const existingTitles = new Set(existingAds.map((a) => a.title));
  const toSeed = allSeedAds.filter((a) => !existingTitles.has(a.title));
  for (const ad of toSeed) {
    await storage.createAd({ ...ad, active: true });
  }
  if (toSeed.length > 0) log(`Seeded ${toSeed.length} additional ads (total target: 15)`);
  const thumbMap = {
    "/ads/falak-mobile.png": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80",
    "/ads/zaiqa-chips.png": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80",
    "/ads/bazaar-online.png": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=80",
    "/ads/sohni-textiles.png": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    "/ads/speedy-riders.png": "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400&q=80",
    "/ads/karims-kitchen.png": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80"
  };
  const latestAds = await storage.getAllAds();
  for (const ad of latestAds) {
    if (thumbMap[ad.thumbnailUrl]) {
      await storage.updateAd(ad.id, { thumbnailUrl: thumbMap[ad.thumbnailUrl] });
    }
  }
}
(async () => {
  await ensureAdminUser();
  await ensureAds();
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
  if (app.get("env") === "development" || process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
