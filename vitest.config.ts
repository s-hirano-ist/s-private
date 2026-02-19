import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/**
 * Vitest Workspace Configuration
 * Integrates test suites across app and packages using test.projects
 */
export default defineConfig({
	test: {
		projects: [
			{
				extends: true,
				plugins: [
					// The plugin will run tests for the stories defined in your Storybook config
					// See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
					storybookTest(),
				],
				test: {
					name: "storybook",
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(),
						instances: [{ browser: "chromium" }],
					},
					setupFiles: [".storybook/vitest.setup.ts"],
				},
			},

			// Main Next.js application with Storybook integration
			{
				extends: "./app/vitest.config.ts",
				test: {
					name: "app",
					root: "./app",
					include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
				},
			},
			// UI Components package
			{
				extends: "./packages/ui/vitest.config.ts",
				test: {
					name: "components",
					root: "./packages/ui",
					include: ["./**/*.test.?(c|m)[jt]s?(x)"],
				},
			},
			// Core domain logic package
			{
				extends: "./packages/core/vitest.config.ts",
				test: {
					name: "core",
					root: "./packages/core",
					include: ["./**/*.test.?(c|m)[jt]s?(x)"],
				},
			},
			// Notification package
			{
				extends: "./packages/notification/vitest.config.ts",
				test: {
					name: "notification",
					root: "./packages/notification",
					include: ["./**/*.test.?(c|m)[jt]s?(x)"],
				},
			},
			// Benchmarks (Node environment, used by `vitest bench --project bench`)
			{
				test: {
					name: "bench",
					include: ["packages/**/*.bench.?(c|m)[jt]s?(x)"],
				},
			},
		],
		coverage: {
			enabled: true,
			reportOnFailure: true,
			reportsDirectory: "./.vitest-coverage",
			include: [
				"app/**/*.{ts,tsx}",
				"packages/ui/**/*.{ts,tsx}",
				"packages/core/**/*.{ts,tsx}",
				"packages/notification/**/*.{ts,tsx}",
			],
			exclude: [
				"**/.next/**/*",
				"**/node_modules/**/*",
				"**/dist/**/*",
				"app/src/generated/**/*",
				"**/*.stories.tsx",
				"**/*.test.ts?(x)",
				"**/types.ts",
				"**/*.interface.ts",
				".storybook/**/*",
			],
			reporter: ["text", "json-summary", "json"],
		},
	},
});
