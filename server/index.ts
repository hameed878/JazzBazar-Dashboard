import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";
import { storage } from "./storage";
import bcrypt from "bcryptjs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PgSession = connectPgSimple(session);

app.set("trust proxy", 1);

app.use(
  session({
    store: new PgSession({
      pool,
      createTableIfMissing: true,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "jazzbazar-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
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
        logLine = logLine.slice(0, 119) + "…";
      }

      log(logLine);
    }
  });

  next();
});

const ADMIN_PHONE = "admin";
const ADMIN_PASSWORD = "Clear@Clear";

async function ensureAdminUser() {
  const existing = await storage.getUserByPhone(ADMIN_PHONE);
  if (!existing) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const { db } = await import("./db");
    const { users } = await import("@shared/schema");
    await db.insert(users).values({
      name: "Administrator",
      phone: ADMIN_PHONE,
      password: hashed,
      pkg: "premium",
      paymentMethod: "jazzcash",
      transactionImage: "",
      status: "approved",
      isAdmin: true,
    });
    log(`Seeded default admin account (phone: ${ADMIN_PHONE} / password: ${ADMIN_PASSWORD})`);
  } else {
    // Migrate legacy default password to the new default so existing installs stay in sync.
    const stillLegacy = await bcrypt.compare("jazzbazar786", existing.password);
    if (stillLegacy) {
      const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await storage.adminUpdateUser(existing.id, { password: hashed } as any);
      log(`Updated admin password to new default (phone: ${ADMIN_PHONE} / password: ${ADMIN_PASSWORD})`);
    }
  }
}

async function ensureAds() {
  const existingAds = await storage.getAllAds();
  if (existingAds.length > 0) return;

  const seedAds = [
    {
      title: "Falak Mobile — Unlimited 4G Load Offer",
      brand: "Falak Mobile",
      category: "Telecom",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      thumbnailUrl: "/ads/falak-mobile.png",
      duration: 15,
    },
    {
      title: "Zaiqa Chips — Crunch Into Flavor",
      brand: "Zaiqa Chips",
      category: "Snacks",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      thumbnailUrl: "/ads/zaiqa-chips.png",
      duration: 15,
    },
    {
      title: "Bazaar Online — Shop Everything, Fast",
      brand: "Bazaar Online",
      category: "E-commerce",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnailUrl: "/ads/bazaar-online.png",
      duration: 15,
    },
    {
      title: "Sohni Textiles — New Winter Collection",
      brand: "Sohni Textiles",
      category: "Fashion",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      thumbnailUrl: "/ads/sohni-textiles.png",
      duration: 15,
    },
    {
      title: "Speedy Riders — Delivered in 30 Minutes",
      brand: "Speedy Riders",
      category: "Delivery",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      thumbnailUrl: "/ads/speedy-riders.png",
      duration: 15,
    },
    {
      title: "Karim's Kitchen — Taste of Home",
      brand: "Karim's Kitchen",
      category: "Restaurant",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      thumbnailUrl: "/ads/karims-kitchen.png",
      duration: 15,
    },
  ];

  for (const ad of seedAds) {
    await storage.createAd({ ...ad, active: true });
  }
  log(`Seeded ${seedAds.length} sample ads`);
}

(async () => {
  await ensureAdminUser();
  await ensureAds();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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
