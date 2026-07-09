import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { getConfig, updateConfig } from "./config";
import {
  signupSchema,
  loginSchema,
  withdrawSchema,
  adminUpdateUserSchema,
  adConfigSchema,
  configUpdateSchema,
  type PackageKey,
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

const uploadsDir = path.join(process.cwd(), "server", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

declare module "express-session" {
  interface SessionData {
    userId?: number;
    isAdmin?: boolean;
  }
}

function toSafeUser(user: any) {
  const { password, ...safe } = user;
  return safe;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.isAdmin) {
    return res.status(401).json({ message: "Admin access required" });
  }
  next();
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve transaction images only to authenticated admins
  app.use("/uploads", requireAdmin, (await import("express")).default.static(uploadsDir));

  app.get("/api/config", async (_req, res) => {
    const config = await getConfig();
    res.json(config);
  });

  app.post("/api/auth/signup", upload.single("transactionImage"), async (req, res) => {
    try {
      const parsed = signupSchema.safeParse({
        name: req.body.name,
        phone: req.body.phone,
        password: req.body.password,
        pkg: req.body.pkg,
        paymentMethod: req.body.paymentMethod,
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
        transactionImage: `/uploads/${req.file.filename}`,
      });

      req.session.userId = user.id;
      req.session.isAdmin = false;
      await new Promise<void>((resolve, reject) =>
        req.session.save((err) => (err ? reject(err) : resolve()))
      );

      res.status(201).json({ user: toSafeUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Something went wrong during signup" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
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
      await new Promise<void>((resolve, reject) =>
        req.session.save((err) => (err ? reject(err) : resolve()))
      );

      res.json({ user: toSafeUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Something went wrong during login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user: toSafeUser(user) });
  });

  app.get("/api/ads", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    const activeAds = await storage.getActiveAds();
    // Sort by id ascending so the plan tiers are deterministic
    const sorted = [...activeAds].sort((a, b) => a.id - b.id);
    const planLimit: Record<string, number> = { basic: 5, standard: 10, premium: 15 };
    const limit = planLimit[user.pkg] ?? sorted.length;
    res.json({ ads: sorted.slice(0, limit) });
  });

  app.post("/api/ads/watch", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    if (user.status !== "approved") {
      return res.status(403).json({ message: "Your account is pending admin verification" });
    }

    const config = await getConfig();
    const dailyLimit = config.packages[user.pkg as PackageKey]?.dailyAds ?? 0;
    const today = todayStr();
    const watchedToday = user.lastAdDate === today ? user.adsWatchedToday : 0;

    if (watchedToday >= dailyLimit) {
      return res.status(400).json({ message: "Daily ad limit reached. Come back tomorrow!" });
    }

    const newBalance = (parseFloat(user.balance) + config.adReward).toFixed(2);
    const updated = await storage.updateAdsWatched(user.id, watchedToday + 1, today, newBalance, user.totalAdsWatched + 1);

    res.json({ user: toSafeUser(updated), reward: config.adReward });
  });

  app.post("/api/withdraw", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    if (user.status !== "approved") {
      return res.status(403).json({ message: "Your account is pending admin verification" });
    }

    const parsed = withdrawSchema.safeParse({
      amount: parseFloat(req.body.amount),
      method: req.body.method,
      accountNumber: req.body.accountNumber,
      accountName: req.body.accountName,
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
      accountName,
    });

    res.json({ withdrawal, balance: newBalance });
  });

  app.get("/api/withdrawals", requireAuth, async (req, res) => {
    const withdrawals = await storage.getWithdrawalsByUser(req.session.userId!);
    res.json({ withdrawals });
  });

  // ---------- Admin routes ----------
  app.post("/api/admin/login", async (req, res) => {
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
    await new Promise<void>((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve()))
    );
    res.json({ user: toSafeUser(user) });
  });

  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    const allUsers = await storage.getAllUsers();
    const allWithdrawals = await storage.getAllWithdrawals();
    const config = await getConfig();

    const normalUsers = allUsers.filter((u) => !u.isAdmin);
    const totalDeposits = normalUsers.reduce((sum, u) => sum + (config.packages[u.pkg as PackageKey]?.price ?? 0), 0);
    const approvedDeposits = normalUsers
      .filter((u) => u.status === "approved")
      .reduce((sum, u) => sum + (config.packages[u.pkg as PackageKey]?.price ?? 0), 0);

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
      paidWithdrawalAmount: allWithdrawals.filter((w) => w.status === "approved").reduce((s, w) => s + parseFloat(w.amount), 0),
    });
  });

  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    const allUsers = await storage.getAllUsers();
    res.json({ users: allUsers.map(toSafeUser) });
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const parsed = adminUpdateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: fromZodError(parsed.error).message });
    }

    const { balance, password, ...rest } = parsed.data;
    const patch: Record<string, any> = { ...rest };
    if (balance !== undefined) patch.balance = balance.toFixed(2);
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

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const user = await storage.getUserById(parseInt(req.params.id));
    if (user?.isAdmin) {
      return res.status(400).json({ message: "Cannot delete an admin account" });
    }
    await storage.deleteUser(parseInt(req.params.id));
    res.json({ message: "User deleted" });
  });

  app.post("/api/admin/users/:id/approve", requireAdmin, async (req, res) => {
    const user = await storage.updateUserStatus(parseInt(req.params.id), "approved");
    res.json({ user: user ? toSafeUser(user) : null });
  });

  app.post("/api/admin/users/:id/reject", requireAdmin, async (req, res) => {
    const user = await storage.updateUserStatus(parseInt(req.params.id), "rejected");
    res.json({ user: user ? toSafeUser(user) : null });
  });

  app.get("/api/admin/withdrawals", requireAdmin, async (_req, res) => {
    const withdrawals = await storage.getAllWithdrawals();
    const allUsers = await storage.getAllUsers();
    const userMap = new Map(allUsers.map((u) => [u.id, toSafeUser(u)]));
    res.json({ withdrawals: withdrawals.map((w) => ({ ...w, user: userMap.get(w.userId) || null })) });
  });

  app.post("/api/admin/withdrawals/:id/approve", requireAdmin, async (req, res) => {
    const withdrawal = await storage.updateWithdrawalStatus(parseInt(req.params.id), "approved");
    res.json({ withdrawal });
  });

  app.post("/api/admin/withdrawals/:id/reject", requireAdmin, async (req, res) => {
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

  app.get("/api/admin/settings", requireAdmin, async (_req, res) => {
    const config = await getConfig();
    res.json(config);
  });

  app.patch("/api/admin/settings", requireAdmin, async (req, res) => {
    const parsed = configUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: fromZodError(parsed.error).message });
    }
    const config = await updateConfig(parsed.data);
    res.json(config);
  });

  app.get("/api/admin/ads", requireAdmin, async (_req, res) => {
    const allAds = await storage.getAllAds();
    res.json({ ads: allAds });
  });

  app.post("/api/admin/ads", requireAdmin, async (req, res) => {
    const parsed = adConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: fromZodError(parsed.error).message });
    }
    const ad = await storage.createAd({ ...parsed.data, active: parsed.data.active ?? true });
    res.status(201).json({ ad });
  });

  app.patch("/api/admin/ads/:id", requireAdmin, async (req, res) => {
    const parsed = adConfigSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: fromZodError(parsed.error).message });
    }
    const ad = await storage.updateAd(parseInt(req.params.id), parsed.data);
    if (!ad) return res.status(404).json({ message: "Ad not found" });
    res.json({ ad });
  });

  app.delete("/api/admin/ads/:id", requireAdmin, async (req, res) => {
    await storage.deleteAd(parseInt(req.params.id));
    res.json({ message: "Ad deleted" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
