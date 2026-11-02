import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	testMatch: "rum.spec.ts",
	workers: 1,
	timeout: 45_000,
	expect: { timeout: 20_000 },
	reporter: "list",
	use: {
		...devices["Desktop Chrome"],
		baseURL: "http://localhost:4317",
		storageState: { cookies: [], origins: [] },
	},
	webServer: {
		command: "pnpm --filter s-private-app start --port 4317",
		url: "http://localhost:4317/logo.png",
		reuseExistingServer: false,
		env: {
			NEXT_PUBLIC_SENTRY_DSN: "https://public@o0.ingest.sentry.io/1",
			SENTRY_AUTH_TOKEN: "",
			SKIP_ENV_VALIDATION: "true",
		},
	},
});
