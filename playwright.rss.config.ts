import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
	testDir: "./e2e",
	testMatch: "rss-reader.spec.ts",
	workers: 1,
	reporter: "list",
	use: {
		...devices["Desktop Chrome"],
		baseURL: process.env.RSS_E2E_BASE_URL ?? "http://localhost:3100",
		trace: "retain-on-failure",
	},
});
