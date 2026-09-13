#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESULTS_DIR = path.join(__dirname, "..", "test-results");
const SNAPSHOTS_DIR = path.join(__dirname, "..", "visual-tests", "snapshots");
const DIFFS_DIR = path.join(__dirname, "..", "visual-tests", "diffs");
const REPORTS_DIR = path.join(__dirname, "..", "reports");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

interface VisualResult {
  route: string;
  mode: string;
  viewport: string;
  type: "fullpage" | "viewport" | "component";
  diffPixels: number;
  diffRatio: number;
  passed: boolean;
  screenshot: string;
  baseline: string;
  diff: string;
}

interface A11yResult {
  route: string;
  mode: string;
  viewport: string;
  violations: number;
  criticalViolations: number;
  details: unknown[];
}

async function generateReports() {
  await ensureDir(REPORTS_DIR);

  const visualResults: VisualResult[] = [];
  const a11yResults: A11yResult[] = [];

  try {
    const visualResultsFile = path.join(RESULTS_DIR, "visual-results.json");
    const visualData = JSON.parse(await fs.readFile(visualResultsFile, "utf-8"));

    for (const suite of visualData.suites) {
      for (const test of suite.tests) {
        for (const result of test.results) {
          if (result.attachments) {
            for (const attachment of result.attachments) {
              if (attachment.name === "visual-diff-fullpage" || attachment.name === "visual-diff-viewport") {
                const data = JSON.parse(attachment.body);
                const parts = test.title.split(" - ");
                visualResults.push({
                  route: parts[0],
                  mode: parts[1]?.split(" ")[0] || "unknown",
                  viewport: parts[1]?.split(" ")[1] || "unknown",
                  type: attachment.name === "visual-diff-fullpage" ? "fullpage" : "viewport",
                  ...data,
                });
              }
              if (attachment.name === "a11y-results") {
                const data = JSON.parse(attachment.body);
                a11yResults.push(data);
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.log("No visual results file found, skipping...");
  }

  const summary = {
    timestamp: new Date().toISOString(),
    visual: {
      total: visualResults.length,
      passed: visualResults.filter((r) => r.passed).length,
      failed: visualResults.filter((r) => !r.passed).length,
      byRoute: {} as Record<string, { passed: number; failed: number }>,
      byMode: {} as Record<string, { passed: number; failed: number }>,
      byViewport: {} as Record<string, { passed: number; failed: number }>,
    },
    accessibility: {
      total: a11yResults.length,
      passed: a11yResults.filter((r) => r.criticalViolations === 0).length,
      failed: a11yResults.filter((r) => r.criticalViolations > 0).length,
      byRoute: {} as Record<string, { passed: number; failed: number }>,
      byMode: {} as Record<string, { passed: number; failed: number }>,
    },
  };

  for (const r of visualResults) {
    if (!summary.visual.byRoute[r.route]) summary.visual.byRoute[r.route] = { passed: 0, failed: 0 };
    if (!summary.visual.byMode[r.mode]) summary.visual.byMode[r.mode] = { passed: 0, failed: 0 };
    if (!summary.visual.byViewport[r.viewport]) summary.visual.byViewport[r.viewport] = { passed: 0, failed: 0 };

    if (r.passed) {
      summary.visual.byRoute[r.route].passed++;
      summary.visual.byMode[r.mode].passed++;
      summary.visual.byViewport[r.viewport].passed++;
    } else {
      summary.visual.byRoute[r.route].failed++;
      summary.visual.byMode[r.mode].failed++;
      summary.visual.byViewport[r.viewport].failed++;
    }
  }

  for (const r of a11yResults) {
    if (!summary.accessibility.byRoute[r.route]) summary.accessibility.byRoute[r.route] = { passed: 0, failed: 0 };
    if (!summary.accessibility.byMode[r.mode]) summary.accessibility.byMode[r.mode] = { passed: 0, failed: 0 };

    if (r.criticalViolations === 0) {
      summary.accessibility.byRoute[r.route].passed++;
      summary.accessibility.byMode[r.mode].passed++;
    } else {
      summary.accessibility.byRoute[r.route].failed++;
      summary.accessibility.byMode[r.mode].failed++;
    }
  }

  await fs.writeFile(
    path.join(REPORTS_DIR, "summary.json"),
    JSON.stringify(summary, null, 2)
  );

  const htmlReport = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi-Pyme Visual Regression & Accessibility Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #0f1724; }
    .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .stat { background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-value { font-size: 2rem; font-weight: bold; }
    .stat-label { color: #64748b; font-size: 0.875rem; }
    .passed { color: #16a34a; }
    .failed { color: #ef4444; }
    .warn { color: #f59e0b; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge-passed { background: #dcfce7; color: #166534; }
    .badge-failed { background: #fee2e2; color: #991b1b; }
    .section { margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Mi-Pyme Visual Regression & Accessibility Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>

    <div class="stats">
      <div class="stat">
        <div class="stat-value passed">${summary.visual.passed}</div>
        <div class="stat-label">Visual Tests Passed</div>
      </div>
      <div class="stat">
        <div class="stat-value failed">${summary.visual.failed}</div>
        <div class="stat-label">Visual Tests Failed</div>
      </div>
      <div class="stat">
        <div class="stat-value passed">${summary.accessibility.passed}</div>
        <div class="stat-label">A11y Tests Passed</div>
      </div>
      <div class="stat">
        <div class="stat-value failed">${summary.accessibility.failed}</div>
        <div class="stat-label">A11y Tests Failed</div>
      </div>
    </div>

    <div class="card section">
      <h2>Visual Regression by Route</h2>
      <table>
        <thead>
          <tr><th>Route</th><th>Passed</th><th>Failed</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${Object.entries(summary.visual.byRoute)
            .map(
              ([route, stats]) => `
            <tr>
              <td>${route}</td>
              <td class="passed">${stats.passed}</td>
              <td class="failed">${stats.failed}</td>
              <td>${stats.passed + stats.failed}</td>
              <td><span class="badge ${stats.failed > 0 ? "badge-failed" : "badge-passed"}">${stats.failed > 0 ? "FAIL" : "PASS"}</span></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="card section">
      <h2>Visual Regression by Mode</h2>
      <table>
        <thead>
          <tr><th>Mode</th><th>Passed</th><th>Failed</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${Object.entries(summary.visual.byMode)
            .map(
              ([mode, stats]) => `
            <tr>
              <td>${mode}</td>
              <td class="passed">${stats.passed}</td>
              <td class="failed">${stats.failed}</td>
              <td>${stats.passed + stats.failed}</td>
              <td><span class="badge ${stats.failed > 0 ? "badge-failed" : "badge-passed"}">${stats.failed > 0 ? "FAIL" : "PASS"}</span></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="card section">
      <h2>Visual Regression by Viewport</h2>
      <table>
        <thead>
          <tr><th>Viewport</th><th>Passed</th><th>Failed</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${Object.entries(summary.visual.byViewport)
            .map(
              ([viewport, stats]) => `
            <tr>
              <td>${viewport}</td>
              <td class="passed">${stats.passed}</td>
              <td class="failed">${stats.failed}</td>
              <td>${stats.passed + stats.failed}</td>
              <td><span class="badge ${stats.failed > 0 ? "badge-failed" : "badge-passed"}">${stats.failed > 0 ? "FAIL" : "PASS"}</span></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="card section">
      <h2>Accessibility by Route</h2>
      <table>
        <thead>
          <tr><th>Route</th><th>Passed</th><th>Failed</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${Object.entries(summary.accessibility.byRoute)
            .map(
              ([route, stats]) => `
            <tr>
              <td>${route}</td>
              <td class="passed">${stats.passed}</td>
              <td class="failed">${stats.failed}</td>
              <td>${stats.passed + stats.failed}</td>
              <td><span class="badge ${stats.failed > 0 ? "badge-failed" : "badge-passed"}">${stats.failed > 0 ? "FAIL" : "PASS"}</span></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="card section">
      <h2>Accessibility by Mode</h2>
      <table>
        <thead>
          <tr><th>Mode</th><th>Passed</th><th>Failed</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${Object.entries(summary.accessibility.byMode)
            .map(
              ([mode, stats]) => `
            <tr>
              <td>${mode}</td>
              <td class="passed">${stats.passed}</td>
              <td class="failed">${stats.failed}</td>
              <td>${stats.passed + stats.failed}</td>
              <td><span class="badge ${stats.failed > 0 ? "badge-failed" : "badge-passed"}">${stats.failed > 0 ? "FAIL" : "PASS"}</span></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
  `;

  await fs.writeFile(path.join(REPORTS_DIR, "index.html"), htmlReport);

  console.log("Reports generated in:", REPORTS_DIR);
  console.log("Summary:", JSON.stringify(summary, null, 2));
}

generateReports().catch(console.error);