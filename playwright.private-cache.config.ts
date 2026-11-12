import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	testMatch: "private-cache.spec.ts",
	workers: 1,
	timeout: 90_000,
	expect: { timeout: 15_000 },
	reporter: "list",
	use: {
		...devices["Desktop Chrome"],
		baseURL: "http://localhost:4327",
		storageState: { cookies: [], origins: [] },
	},
	webServer: [
		{
			command: "node e2e/fixtures/private-cache-backend.mjs",
			url: "http://127.0.0.1:4328/health",
			reuseExistingServer: false,
		},
		{
			command: "pnpm --filter s-private-app start --port 4327",
			url: "http://localhost:4327/logo.png",
			reuseExistingServer: false,
			env: {
				SKIP_ENV_VALIDATION: "true",
				BACKEND_URL: "http://127.0.0.1:4328",
				BETTER_AUTH_URL: "http://localhost:4327",
				LOCAL_DEV_MODE: "false",
			},
		},
	],
});
