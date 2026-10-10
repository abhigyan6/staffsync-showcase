import { defineConfig } from "@playwright/test";
import fs from "node:fs";
const installedChrome =
  process.env.PLAYWRIGHT_CHROME_PATH ||
  (process.platform === "darwin" &&
  fs.existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : undefined);
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  workers: 1,
  timeout: 120000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5175",
    launchOptions: installedChrome ? { executablePath: installedChrome } : {},
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "node tests/browser-server.js",
      url: "http://127.0.0.1:4001/api/health",
      timeout: 60000,
    },
    {
      command: "npm run dev:client -- --port 5175 --strictPort",
      url: "http://127.0.0.1:5175",
      env: { API_PORT: "4001" },
      timeout: 30000,
    },
  ],
});
