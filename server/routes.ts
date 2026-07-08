import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { signupSchema, loginSchema, PACKAGES, AD_REWARD, PAYMENT_ACCOUNT_NUMBER, PAYMENT_ACCOUNT_NAME, type PackageKey } from "@shared/schema";
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
  app.use("/uploads", (await import("express")).default.static(uploadsDir));

  app.get("/api/config", (_req, res) => {
    res.json({
      packages: PACKAGES,
      paymentAccountNumber: PAYMENT_ACCOUNT_NUMBER,
      paymentAccountName: PAYMENT_ACCOUNT_NAME,
    });
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

      const match = await bcrypt.compare(parsed.data.password, user.password);
      if (!match) {
        return res.status(401).json({ message: "Invalid phone number or password" });
      }

      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;

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

  app.post("/api/ads/watch", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    if (user.status !== "approved") {
      return res.status(403).json({ message: "Your account is pending admin verification" });
    }

    const dailyLimit = PACKAGES[user.pkg as PackageKey]?.dailyAds ?? 0;
    const today = todayStr();
    const watchedToday = user.lastAdDate === today ? user.adsWatchedToday : 0;

    if (watchedToday >= dailyLimit) {
      return res.status(400).json({ message: "Daily ad limit reached. Come back tomorrow!" });
    }

    const newBalance = (parseFloat(user.balance) + AD_REWARD).toFixed(2);
    const updated = await storage.updateAdsWatched(user.id, watchedToday + 1, today, newBalance);

    res.json({ user: toSafeUser(updated), reward: AD_REWARD });
  });

  app.post("/api/withdraw", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    if (user.status !== "approved") {
      return res.status(403).json({ message: "Your account is pending admin verification" });
    }

    const amount = parseFloat(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Enter a valid amount" });
    }

    const balance = parseFloat(user.balance);
    if (amount > balance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    if (amount < 500) {
      return res.status(400).json({ message: "Minimum withdrawal amount is Rs. 500" });
    }

    const newBalance = (balance - amount).toFixed(2);
    await storage.deductBalance(user.id, newBalance);
    const withdrawal = await storage.createWithdrawal(user.id, amount.toFixed(2));

    res.json({ withdrawal, balance: newBalance });
  });

  app.get("/api/withdrawals", requireAuth, async (req, res) => {
    const withdrawals = await storage.getWithdrawalsByUser(req.session.userId!);
    res.json({ withdrawals });
  });

  // Admin routes
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
    res.json({ user: toSafeUser(user) });
  });

  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    const allUsers = await storage.getAllUsers();
    res.json({ users: allUsers.map(toSafeUser) });
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
    res.json({ withdrawals });
  });

  app.post("/api/admin/withdrawals/:id/approve", requireAdmin, async (req, res) => {
    const withdrawal = await storage.updateWithdrawalStatus(parseInt(req.params.id), "approved");
    res.json({ withdrawal });
  });

  app.post("/api/admin/withdrawals/:id/reject", requireAdmin, async (req, res) => {
    const withdrawal = await storage.updateWithdrawalStatus(parseInt(req.params.id), "rejected");
    res.json({ withdrawal });
  });

  const httpServer = createServer(app);
  return httpServer;
}
