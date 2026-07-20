import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 20_000,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  webServer: { command: "npm run preview", url: "http://127.0.0.1:4173", reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
