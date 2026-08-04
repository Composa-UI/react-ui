import { defineConfig } from "@playwright/test";

const port = process.env.COMPOSA_UI_E2E_PORT ?? "5196";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.(e2e|spec)\.ts/,
  workers: 1,
  use: {
    baseURL,
    viewport: { width: 1120, height: 720 },
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --force`,
    url: `${baseURL}/?view=issue-77-anchored-overlay`,
    reuseExistingServer: false,
  },
});
