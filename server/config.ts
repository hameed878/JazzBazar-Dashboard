import { storage } from "./storage";
import { DEFAULT_CONFIG, type AppConfig } from "@shared/schema";

const CONFIG_KEY = "app_config";

export async function getConfig(): Promise<AppConfig> {
  const raw = await storage.getSetting(CONFIG_KEY);
  if (!raw) {
    await storage.setSetting(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  }
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed, packages: { ...DEFAULT_CONFIG.packages, ...(parsed.packages || {}) } };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function updateConfig(patch: Partial<AppConfig>): Promise<AppConfig> {
  const current = await getConfig();
  const next: AppConfig = {
    ...current,
    ...patch,
    packages: { ...current.packages, ...(patch.packages || {}) },
  };
  await storage.setSetting(CONFIG_KEY, JSON.stringify(next));
  return next;
}
