import { defineConfig } from "@playwright/test";

const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  use: {
    trace: "retain-on-failure",
  },
  webServer: process.env.E2E_START_SERVER === "true"
    ? { command: "npm run dev -- --port 3000", url: appUrl, reuseExistingServer: !process.env.CI, timeout: 120_000 }
    : undefined,
});
