import { defineConfig } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://localhost:5173";
const isRemote = !baseURL.includes("localhost");

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL,
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  // Only spin up the local dev server when testing against localhost.
  webServer: isRemote
    ? undefined
    : {
        command: "npx vite",
        url: "http://localhost:5173",
        reuseExistingServer: true,
      },
});
