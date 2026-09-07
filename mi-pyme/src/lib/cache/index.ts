import NodeCache from "node-cache";
import fs from "fs";
import path from "path";
import { join } from "path";

const cache = new NodeCache({
  stdTTL: 600,
  checkperiod: 120,
  useClones: false,
});

const cacheDir = join(process.cwd(), "data", "cache");
const cacheFile = path.join(cacheDir, "cache.json");

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

function loadInitialCache() {
  try {
    if (fs.existsSync(cacheFile)) {
      const raw = fs.readFileSync(cacheFile, "utf-8");
      const data = JSON.parse(raw) as Record<string, unknown>;
      for (const [key, value] of Object.entries(data)) {
        cache.set(key, value);
      }
    }
  } catch (e) {
    console.error("Failed to load cache from disk:", e);
  }
}

loadInitialCache();

export function getCache<T = unknown>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function setCache(key: string, value: unknown) {
  cache.set(key, value);
  persistAll();
}

export function delCache(key: string) {
  cache.del(key);
  persistAll();
}

export function clearCache() {
  cache.flushAll();
  persistAll();
}

function persistAll() {
  try {
    const keys = cache.keys();
    const snapshot: Record<string, unknown> = {};
    for (const key of keys) {
      snapshot[key] = cache.get(key);
    }
    fs.writeFileSync(cacheFile, JSON.stringify(snapshot, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to persist cache:", e);
  }
}
