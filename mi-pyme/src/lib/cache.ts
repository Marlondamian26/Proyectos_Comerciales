import NodeCache from "node-cache";
import fs from "fs";
import path from "path";

const cache = new NodeCache({
  stdTTL: 600,
  checkperiod: 120,
  useClones: false,
});

const cacheDir = path.join(process.cwd(), "data", "cache");
const cacheFile = path.join(cacheDir, "cache.json");

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

export function getCache<T = any>(key: string): T | undefined {
  return cache.get(key);
}

export function setCache(key: string, value: any) {
  cache.set(key, value);
  persistKeys();
}

export function delCache(key: string) {
  cache.del(key);
  persistKeys();
}

export function clearCache() {
  cache.flushAll();
  persistKeys();
}

function persistKeys() {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(cache.keys()));
  } catch (e) {
    console.error("Failed to persist cache keys:", e);
  }
}
