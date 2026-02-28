import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: "html",
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		storageState: ".auth/user.json",
	},
	projects: [
		{
			name: "auth-setup",
			testMatch: /auth\.setup\.ts/,
			use: {
				...devices["Desktop Chrome"],
				storageState: undefined,
			},
		},
		{
			name: "chaos-chromium",
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["auth-setup"],
		},
	],
	webServer: {
		command: "pnpm --filter s-private-app dev",
		url: "http://localhost:3000",
		reuseExistingServer: true,
		timeout: 120_000,
	},
});
