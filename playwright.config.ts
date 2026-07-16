import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.e2e\.ts/,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5196",
    viewport: { width: 1120, height: 720 },
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5196 --force",
    url: "http://127.0.0.1:5196/?view=issue-77-anchored-overlay",
    reuseExistingServer: false,
  },
});
