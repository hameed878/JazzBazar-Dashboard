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

  // Always migrate broken Google Cloud Storage URLs (return 403) to working alternatives
  const videoMigration: Record<string, string> = {
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4": "https://www.w3schools.com/html/mov_bbb.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4": "https://www.w3schools.com/html/movie.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4": "https://media.w3.org/2010/05/sintel/trailer.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4": "https://media.w3.org/2010/05/video/movie_300.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4": "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4": "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4": "https://www.w3schools.com/html/mov_bbb.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4": "https://media.w3.org/2010/05/sintel/trailer.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4": "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4": "https://media.w3.org/2010/05/video/movie_300.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4": "https://www.w3schools.com/html/mov_bbb.mp4",
  };
  let migratedCount = 0;
  for (const ad of existingAds) {
    const newVideoUrl = videoMigration[ad.videoUrl];
    if (newVideoUrl) {
      await storage.updateAd(ad.id, { videoUrl: newVideoUrl });
      migratedCount++;
    }
  }
  if (migratedCount > 0) log(`Migrated ${migratedCount} ad video URLs to working sources`);

  if (existingAds.length >= 15) return;

  // Working video URLs (verified reachable from this environment)
  const V = {
    bbb:     "https://www.w3schools.com/html/mov_bbb.mp4",
    movie:   "https://www.w3schools.com/html/movie.mp4",
    sintel:  "https://media.w3.org/2010/05/sintel/trailer.mp4",
    w3movie: "https://media.w3.org/2010/05/video/movie_300.mp4",
    flower:  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    plyr:    "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4",
    sample:  "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
  };

  const allSeedAds = [
    // Basic tier — visible to all plans
    {
      title: "Falak Mobile — Unlimited 4G Load Offer",
      brand: "Falak Mobile",
      category: "Telecom",
      videoUrl: V.bbb,
      thumbnailUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80",
      duration: 15,
    },
    {
      title: "Zaiqa Chips — Crunch Into Flavor",
      brand: "Zaiqa Chips",
      category: "Snacks",
      videoUrl: V.movie,
      thumbnailUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80",
      duration: 15,
    },
    {
      title: "Bazaar Online — Shop Everything, Fast",
      brand: "Bazaar Online",
      category: "E-commerce",
      videoUrl: V.sintel,
      thumbnailUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=80",
      duration: 15,
    },
    {
      title: "Sohni Textiles — New Winter Collection",
      brand: "Sohni Textiles",
      category: "Fashion",
      videoUrl: V.flower,
      thumbnailUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
      duration: 15,
    },
    {
      title: "Speedy Riders — Delivered in 30 Minutes",
      brand: "Speedy Riders",
      category: "Delivery",
      videoUrl: V.w3movie,
      thumbnailUrl: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400&q=80",
      duration: 15,
    },
    // Standard tier — visible to Standard & Premium
    {
      title: "Karim's Kitchen — Taste of Home",
      brand: "Karim's Kitchen",
      category: "Restaurant",
      videoUrl: V.plyr,
      thumbnailUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
      duration: 15,
    },
    {
      title: "PakDrive — Find Your Dream Car",
      brand: "PakDrive",
      category: "Automotive",
      videoUrl: V.sample,
      thumbnailUrl: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80",
      duration: 15,
    },
    {
      title: "HealthPlus — Your Wellness Partner",
      brand: "HealthPlus",
      category: "Health",
      videoUrl: V.bbb,
      thumbnailUrl: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&q=80",
      duration: 15,
    },
    {
      title: "BrightStar Academy — Learn & Grow",
      brand: "BrightStar Academy",
      category: "Education",
      videoUrl: V.sintel,
      thumbnailUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80",
      duration: 15,
    },
    {
      title: "GlowUp Cosmetics — Shine Every Day",
      brand: "GlowUp Cosmetics",
      category: "Beauty",
      videoUrl: V.flower,
      thumbnailUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80",
      duration: 15,
    },
    // Premium tier — visible to Premium only
    {
      title: "SkyTravel — Fly Anywhere for Less",
      brand: "SkyTravel",
      category: "Travel",
      videoUrl: V.plyr,
      thumbnailUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80",
      duration: 20,
    },
    {
      title: "CryptoEarn PK — Invest Smart",
      brand: "CryptoEarn PK",
      category: "Finance",
      videoUrl: V.movie,
      thumbnailUrl: "https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400&q=80",
      duration: 20,
    },
    {
      title: "LuxeHome — Furniture That Lasts",
      brand: "LuxeHome",
      category: "Home Decor",
      videoUrl: V.w3movie,
      thumbnailUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
      duration: 20,
    },
    {
      title: "ActiveGear PK — Sports Equipment Sale",
      brand: "ActiveGear PK",
      category: "Sports",
      videoUrl: V.sample,
      thumbnailUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=80",
      duration: 20,
    },
    {
      title: "TechZone — Gadgets at Best Price",
      brand: "TechZone",
      category: "Technology",
      videoUrl: V.bbb,
      thumbnailUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80",
      duration: 20,
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
