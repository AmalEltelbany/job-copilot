import { defineConfig, devices } from "@playwright/test";

const apiEnv = {
  PORT: "4100",
  NODE_ENV: "test",
  DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://copilot:copilot@localhost:5432/copilot_test?schema=public",
  JWT_SECRET: "e2e-secret-at-least-16-chars",
  // Browser tests never call the paid model.
  LLM_PROVIDER: "fake",
};

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    // Lets the suite reuse a locally installed Chromium instead of downloading one.
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node dist/main.js",
      cwd: "../apps/api",
      url: "http://localhost:4100/api/health",
      env: apiEnv,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm start",
      cwd: "../apps/web",
      url: "http://localhost:3100",
      env: { API_URL: "http://localhost:4100" },
      reuseExistingServer: !process.env.CI,
    },
  ],
});
