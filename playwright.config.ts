import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração do Playwright Test para automação End-to-End (E2E).
 * Suporta testes determinísticos integrados aos mocks do MSW no navegador.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    port: 5173,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
