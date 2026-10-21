import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIRS = {
  desktop: "./lighthouse-reports/desktop",
  mobile: "./lighthouse-reports/mobile",
};

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function loadRuns(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".json") && !f.includes("manifest"));
  return files.map((f) => JSON.parse(readFileSync(join(dir, f), "utf-8")));
}

function summarize(form, dir) {
  const runs = loadRuns(dir);
  const byUrl = new Map();
  for (const run of runs) {
    const url = new URL(run.finalUrl ?? run.requestedUrl).pathname;
    if (!byUrl.has(url)) byUrl.set(url, []);
    byUrl.get(url).push(run);
  }

  const result = {};
  for (const [url, urlRuns] of byUrl) {
    result[url] = {
      runs: urlRuns.length,
      performance: median(urlRuns.map((r) => r.categories.performance.score * 100)),
      accessibility: median(urlRuns.map((r) => r.categories.accessibility.score * 100)),
      bestPractices: median(urlRuns.map((r) => r.categories["best-practices"].score * 100)),
      seo: median(urlRuns.map((r) => r.categories.seo.score * 100)),
      lcpMs: median(urlRuns.map((r) => r.audits["largest-contentful-paint"].numericValue)),
      cls: median(urlRuns.map((r) => r.audits["cumulative-layout-shift"].numericValue)),
      tbtMs: median(urlRuns.map((r) => r.audits["total-blocking-time"].numericValue)),
      inpMs: median(
        urlRuns.map((r) => r.audits["interaction-to-next-paint"]?.numericValue ?? null).filter((v) => v != null),
      ),
    };
  }
  return { form, ...result };
}

const report = Object.fromEntries(Object.entries(DIRS).map(([form, dir]) => [form, summarize(form, dir)]));

writeFileSync("./lighthouse-reports/summary.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
