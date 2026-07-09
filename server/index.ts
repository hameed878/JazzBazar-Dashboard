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
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
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

  // Migrate any non-YouTube ad to the correct Pakistani brand YouTube URL by title.
  // This runs every startup so new installs and existing installs are both fixed.
  const titleToYouTube: Record<string, string> = {
    // Basic tier
    "Jazz — Pakistan Mein Sab Se Tez Network":      "https://www.youtube.com/watch?v=ss2M1J9IFiA",
    "Ufone 4G — U Tou Babar Hai":                   "https://www.youtube.com/watch?v=D6fPrRaTwBE",
    "Telenor Pakistan — Zainab Ki Kahani":           "https://www.youtube.com/watch?v=_u_naO4mWLc",
    "Surf Excel — KhushiyonKaSadqa Ramazan 2022":   "https://www.youtube.com/watch?v=zTsBZMCq3a8",
    "NESCAFÉ Pakistan — Imkan Hai":                  "https://www.youtube.com/watch?v=VySzhAKpBew",
    // Standard tier
    "Ufone — Sohni Mahiwal Weekly Offer":            "https://www.youtube.com/watch?v=O3SjrE7AmEw",
    "Knorr Pakistan — Nayi Duniya Ke Zaiqay":        "https://www.youtube.com/watch?v=wy1tjUJX4f0",
    "MILO Pakistan — Fuel For School":               "https://www.youtube.com/watch?v=JSl206o6mDU",
    "HBL — Islamic Personal Finance":                "https://www.youtube.com/watch?v=dCK8bctt9EY",
    "Zong 4G — Business Solutions":                  "https://www.youtube.com/watch?v=BvsOcru1DPE",
    // Premium tier
    "Pepsi Pakistan — Khelenge Beat Pe (PSL 11)":   "https://www.youtube.com/watch?v=DNd4nwMoUIM",
    "Surf Excel — Daag Ache Hain (Puddlewar)":      "https://www.youtube.com/watch?v=6o6JJIkamVY",
    "Telenor Pakistan — Gaming Sim":                 "https://www.youtube.com/watch?v=5C4tZUKXEMo",
    "Shan Foods — Masala Cola":                      "https://www.youtube.com/watch?v=rJSieo5RNlU",
    "Nestlé Fruita Vitals — Taste of Pakistan":     "https://www.youtube.com/watch?v=ZoMpagkhJTY",
    // Legacy placeholder titles → redirect to correct YouTube ads
    "Falak Mobile — Unlimited 4G Load Offer":        "https://www.youtube.com/watch?v=ss2M1J9IFiA",
    "Zaiqa Chips — Crunch Into Flavor":              "https://www.youtube.com/watch?v=O3SjrE7AmEw",
    "Bazaar Online — Shop Everything, Fast":         "https://www.youtube.com/watch?v=wy1tjUJX4f0",
    "Sohni Textiles — New Winter Collection":        "https://www.youtube.com/watch?v=zTsBZMCq3a8",
    "Speedy Riders — Delivered in 30 Minutes":       "https://www.youtube.com/watch?v=VySzhAKpBew",
    "Karim's Kitchen — Taste of Home":               "https://www.youtube.com/watch?v=wy1tjUJX4f0",
    "PakDrive — Find Your Dream Car":                "https://www.youtube.com/watch?v=BvsOcru1DPE",
    "HealthPlus — Your Wellness Partner":            "https://www.youtube.com/watch?v=JSl206o6mDU",
    "BrightStar Academy — Learn & Grow":             "https://www.youtube.com/watch?v=dCK8bctt9EY",
    "GlowUp Cosmetics — Shine Every Day":            "https://www.youtube.com/watch?v=rJSieo5RNlU",
    "SkyTravel — Fly Anywhere for Less":             "https://www.youtube.com/watch?v=DNd4nwMoUIM",
    "CryptoEarn PK — Invest Smart":                  "https://www.youtube.com/watch?v=5C4tZUKXEMo",
    "LuxeHome — Furniture That Lasts":               "https://www.youtube.com/watch?v=ZoMpagkhJTY",
    "ActiveGear PK — Sports Equipment Sale":         "https://www.youtube.com/watch?v=6o6JJIkamVY",
    "TechZone — Gadgets at Best Price":              "https://www.youtube.com/watch?v=D6fPrRaTwBE",
  };
  // Also migrate by URL: any ad whose videoUrl doesn't contain youtube.com gets
  // re-assigned via title map, OR falls back to the first Basic-tier YouTube URL.
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

  // Seed real Pakistani brand ads using YouTube video IDs
  const allSeedAds = [
    // ── Basic tier (visible to all plans) ──
    {
      title: "Jazz — Pakistan Mein Sab Se Tez Network",
      brand: "Jazz",
      category: "Telecom",
      videoUrl: "https://www.youtube.com/watch?v=ss2M1J9IFiA",
      thumbnailUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
      duration: 30,
    },
    {
      title: "Ufone 4G — U Tou Babar Hai",
      brand: "Ufone",
      category: "Telecom",
      videoUrl: "https://www.youtube.com/watch?v=D6fPrRaTwBE",
      thumbnailUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80",
      duration: 30,
    },
    {
      title: "Telenor Pakistan — Zainab Ki Kahani",
      brand: "Telenor Pakistan",
      category: "Telecom",
      videoUrl: "https://www.youtube.com/watch?v=_u_naO4mWLc",
      thumbnailUrl: "https://images.unsplash.com/photo-1596077921836-4bab7fcf7e76?w=400&q=80",
      duration: 30,
    },
    {
      title: "Surf Excel — KhushiyonKaSadqa Ramazan 2022",
      brand: "Surf Excel",
      category: "FMCG",
      videoUrl: "https://www.youtube.com/watch?v=zTsBZMCq3a8",
      thumbnailUrl: "https://images.unsplash.com/photo-1584545284372-f22510eb7c26?w=400&q=80",
      duration: 60,
    },
    {
      title: "NESCAFÉ Pakistan — Imkan Hai",
      brand: "NESCAFÉ Pakistan",
      category: "Beverages",
      videoUrl: "https://www.youtube.com/watch?v=VySzhAKpBew",
      thumbnailUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
      duration: 30,
    },
    // ── Standard tier (visible to Standard & Premium) ──
    {
      title: "Ufone — Sohni Mahiwal Weekly Offer",
      brand: "Ufone",
      category: "Telecom",
      videoUrl: "https://www.youtube.com/watch?v=O3SjrE7AmEw",
      thumbnailUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
      duration: 60,
    },
    {
      title: "Knorr Pakistan — Nayi Duniya Ke Zaiqay",
      brand: "Knorr Pakistan",
      category: "Food",
      videoUrl: "https://www.youtube.com/watch?v=wy1tjUJX4f0",
      thumbnailUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80",
      duration: 30,
    },
    {
      title: "MILO Pakistan — Fuel For School",
      brand: "MILO Pakistan",
      category: "Beverages",
      videoUrl: "https://www.youtube.com/watch?v=JSl206o6mDU",
      thumbnailUrl: "https://images.unsplash.com/photo-1559181567-c3190becdac5?w=400&q=80",
      duration: 30,
    },
    {
      title: "HBL — Islamic Personal Finance",
      brand: "HBL",
      category: "Banking",
      videoUrl: "https://www.youtube.com/watch?v=dCK8bctt9EY",
      thumbnailUrl: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=400&q=80",
      duration: 30,
    },
    {
      title: "Zong 4G — Business Solutions",
      brand: "Zong 4G",
      category: "Telecom",
      videoUrl: "https://www.youtube.com/watch?v=BvsOcru1DPE",
      thumbnailUrl: "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=400&q=80",
      duration: 30,
    },
    // ── Premium tier (visible to Premium only) ──
    {
      title: "Pepsi Pakistan — Khelenge Beat Pe (PSL 11)",
      brand: "Pepsi Pakistan",
      category: "Beverages",
      videoUrl: "https://www.youtube.com/watch?v=DNd4nwMoUIM",
      thumbnailUrl: "https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=400&q=80",
      duration: 180,
    },
    {
      title: "Surf Excel — Daag Ache Hain (Puddlewar)",
      brand: "Surf Excel",
      category: "FMCG",
      videoUrl: "https://www.youtube.com/watch?v=6o6JJIkamVY",
      thumbnailUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
      duration: 60,
    },
    {
      title: "Telenor Pakistan — Gaming Sim",
      brand: "Telenor Pakistan",
      category: "Telecom",
      videoUrl: "https://www.youtube.com/watch?v=5C4tZUKXEMo",
      thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80",
      duration: 30,
    },
    {
      title: "Shan Foods — Masala Cola",
      brand: "Shan Foods",
      category: "Food",
      videoUrl: "https://www.youtube.com/watch?v=rJSieo5RNlU",
      thumbnailUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80",
      duration: 30,
    },
    {
      title: "Nestlé Fruita Vitals — Taste of Pakistan",
      brand: "Nestlé Pakistan",
      category: "Beverages",
      videoUrl: "https://www.youtube.com/watch?v=ZoMpagkhJTY",
      thumbnailUrl: "https://images.unsplash.com/photo-1560508180-03f285f67ded?w=400&q=80",
      duration: 30,
    },
  ];

  // Only seed ads that don't already exist (by title)
  const existingTitles = new Set(existingAds.map((a) => a.title));
  const toSeed = allSeedAds.filter((a) => !existingTitles.has(a.title));
  for (const ad of toSeed) {
    await storage.createAd({ ...ad, active: true });
  }
  if (toSeed.length > 0) log(`Seeded ${toSeed.length} additional ads (total target: 15)`);

  // Migrate broken local thumbnail paths to working Unsplash URLs
  const thumbMap: Record<string, string> = {
    "/ads/falak-mobile.png": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80",
    "/ads/zaiqa-chips.png": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80",
    "/ads/bazaar-online.png": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=80",
    "/ads/sohni-textiles.png": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    "/ads/speedy-riders.png": "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400&q=80",
    "/ads/karims-kitchen.png": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
  };
  // Re-fetch to catch newly seeded ads too
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
