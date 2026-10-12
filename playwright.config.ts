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
			testMatch: /auth\.setup\.ts/u,
			use: {
				...devices["Desktop Chrome"],
				storageState: { cookies: [], origins: [] },
			},
		},
		{
			name: "chaos-chromium",
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["auth-setup"],
		},
	],
	webServer:
		process.env.PLAYWRIGHT_SKIP_WEBSERVER === "true"
			? undefined
			: [
					{
						command: "pnpm --filter s-private-backend dev",
						url: "http://127.0.0.1:3002/health",
						env: { BACKEND_PORT: "3002" },
						reuseExistingServer: !process.env.CI,
						timeout: 120_000,
					},
					{
						command: "pnpm --filter s-private-app dev",
						url: "http://localhost:3000/logo.png",
						env: { BACKEND_URL: "http://127.0.0.1:3002" },
						reuseExistingServer: !process.env.CI,
						timeout: 120_000,
					},
				],
});
