import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./audit-tests",

  timeout: 60000,

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },

    {
      name: "chromium-mobile",
      use: {
        ...devices["iPhone 13"],
      },
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },

    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
      },
    },
  ],

  reporter: [["html", { outputFolder: "audit/playwright-report" }], ["list"]],
});
