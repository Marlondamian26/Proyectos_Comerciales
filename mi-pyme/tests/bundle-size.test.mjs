import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const MAX_TOTAL_BUNDLE_SIZE_MB = 400;
const MAX_JS_CHUNK_SIZE_MB = 100;
const MAX_CSS_SIZE_MB = 100;

async function getBundleSize() {
  const buildDir = path.join(process.cwd(), ".next", "static");
  const chunksDir = path.join(buildDir, "chunks");

  let totalSize = 0;
  const jsSizes: number[] = [];
  let cssSize = 0;

  function walkDir(dir: string): number {
    let size = 0;
    if (!fs.existsSync(dir)) return 0;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        size += walkDir(fullPath);
      } else {
        const stat = fs.statSync(fullPath);
        size += stat.size;

        if (entry.name.endsWith(".css")) {
          cssSize += stat.size;
        } else if (entry.name.endsWith(".js")) {
          jsSizes.push(stat.size);
        }
      }
    }
    return size;
  }

  totalSize = walkDir(chunksDir);

  const totalSizeMB = totalSize / (1024 * 1024);
  const jsMaxMB = (jsSizes.length > 0 ? Math.max(...jsSizes) : 0) / (1024 * 1024);
  const cssSizeMB = cssSize / (1024 * 1024);

  return {
    totalSizeMB,
    jsMaxMB,
    cssSizeMB,
    jsChunks: jsSizes.length,
  };
}

test.describe("Bundle size monitoring", () => {
  test("total static assets size is within budget", async () => {
    const sizes = await getBundleSize();

    console.log(`Bundle sizes:
  Total: ${sizes.totalSizeMB.toFixed(2)} MB
  JS max chunk: ${sizes.jsMaxMB.toFixed(2)} MB
  CSS: ${sizes.cssSizeMB.toFixed(2)} MB
  JS chunks: ${sizes.jsChunks}`);

    expect(sizes.totalSizeMB).toBeLessThan(MAX_TOTAL_BUNDLE_SIZE_MB);
  });

  test("no single JS chunk exceeds limit", async () => {
    const sizes = await getBundleSize();
    expect(sizes.jsMaxMB).toBeLessThan(MAX_JS_CHUNK_SIZE_MB);
  });

  test("CSS bundle size is within limit", async () => {
    const sizes = await getBundleSize();
    expect(sizes.cssSizeMB).toBeLessThan(MAX_CSS_SIZE_MB);
  });
});
