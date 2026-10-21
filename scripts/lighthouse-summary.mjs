/**
 * Consolida as auditorias do Lighthouse CI (desktop e mobile).
 *
 * - Calcula a mediana de cada categoria e de LCP/CLS/TBT por página e perfil.
 * - Copia o relatório HTML/JSON da execução representativa (mediana, segundo o
 *   manifest do LHCI) para `reports/lighthouse/`, que é versionado.
 * - Registra versões das ferramentas e condições de execução (throttling, viewport).
 */
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { arch, cpus, platform, release } from "node:os";
import { join } from "node:path";

const SOURCE_DIRS = {
  desktop: "./lighthouse-reports/desktop",
  mobile: "./lighthouse-reports/mobile",
};
const OUTPUT_DIR = "./reports/lighthouse";

const require = createRequire(import.meta.url);

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const round = (value, digits = 0) =>
  value === null ? null : Number(value.toFixed(digits));

function pageSlug(pathname) {
  return pathname === "/" ? "home" : pathname.replace(/^\/|\/$/g, "").replace(/\//g, "-");
}

function loadRuns(dir) {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".report.json"))
    .map((file) => JSON.parse(readFileSync(join(dir, file), "utf-8")));
}

function readManifest(dir) {
  return JSON.parse(readFileSync(join(dir, "manifest.json"), "utf-8"));
}

function summarize(form, dir) {
  const byPage = new Map();
  for (const run of loadRuns(dir)) {
    const pathname = new URL(run.finalUrl ?? run.requestedUrl).pathname;
    if (!byPage.has(pathname)) byPage.set(pathname, []);
    byPage.get(pathname).push(run);
  }

  const representative = new Map(
    readManifest(dir)
      .filter((entry) => entry.isRepresentativeRun)
      .map((entry) => [new URL(entry.url).pathname, entry]),
  );

  const pages = {};
  for (const [pathname, runs] of byPage) {
    const score = (category) =>
      round(median(runs.map((r) => r.categories[category].score * 100)));
    const metric = (audit, digits) =>
      round(median(runs.map((r) => r.audits[audit].numericValue)), digits);

    const reportBase = `${form}-${pageSlug(pathname)}`;
    const entry = representative.get(pathname);
    if (entry) {
      copyFileSync(entry.htmlPath, join(OUTPUT_DIR, `${reportBase}.report.html`));
      copyFileSync(entry.jsonPath, join(OUTPUT_DIR, `${reportBase}.report.json`));
    }

    pages[pathname] = {
      runs: runs.length,
      performance: score("performance"),
      accessibility: score("accessibility"),
      bestPractices: score("best-practices"),
      seo: score("seo"),
      lcpMs: metric("largest-contentful-paint", 0),
      cls: metric("cumulative-layout-shift", 3),
      tbtMs: metric("total-blocking-time", 0),
      report: entry ? `${reportBase}.report.html` : null,
    };
  }

  const sample = loadRuns(dir)[0];
  const settings = sample.configSettings;
  return {
    pages,
    conditions: {
      formFactor: settings.formFactor,
      throttlingMethod: settings.throttlingMethod,
      throttling: settings.throttling,
      screenEmulation: settings.screenEmulation,
      benchmarkIndex: sample.environment.benchmarkIndex,
    },
    lighthouseVersion: sample.lighthouseVersion,
    chrome: sample.environment.hostUserAgent.match(/Chrome\/[\d.]+/)?.[0] ?? null,
  };
}

mkdirSync(OUTPUT_DIR, { recursive: true });

const profiles = Object.fromEntries(
  Object.entries(SOURCE_DIRS).map(([form, dir]) => [form, summarize(form, dir)]),
);

const report = {
  generatedAt: new Date().toISOString(),
  target: "pnpm build + pnpm preview (cenário padrão dos mocks)",
  aggregation: "mediana de 3 execuções por página e perfil",
  tools: {
    lighthouse: profiles.desktop.lighthouseVersion,
    lhci: require("@lhci/cli/package.json").version,
    chrome: profiles.desktop.chrome,
    node: process.version,
  },
  environment: {
    os: `${platform()} ${release()} (${arch()})`,
    cpu: cpus()[0]?.model.trim() ?? null,
  },
  profiles,
};

const json = JSON.stringify(report, null, 2);
writeFileSync(join(OUTPUT_DIR, "summary.json"), `${json}\n`);
writeFileSync("./lighthouse-reports/summary.json", `${json}\n`);
console.log(json);
