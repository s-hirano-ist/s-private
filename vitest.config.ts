// import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { defineConfig } from "vitest/config";

/**
 * Vitest Workspace Configuration
 * Integrates test suites across app and packages using test.projects
 */
export default defineConfig({
	test: {
		projects: [
			// {
			// 	extends: true,
			// 	plugins: [
			// 		// The plugin will run tests for the stories defined in your Storybook config
			// 		// See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
			// 		storybookTest(),
			// 	],
			// 	test: {
			// 		name: "storybook",
			// 		browser: {
			// 			enabled: true,
			// 			headless: true,
			// 			provider: "playwright",
			// 			instances: [{ browser: "chromium" }],
			// 		},
			// 		setupFiles: [".storybook/vitest.setup.ts"],
			// 	},
			// },

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
			// Domain logic package
			{
				extends: "./packages/domains/vitest.config.ts",
				test: {
					name: "domains",
					root: "./packages/domains",
					include: ["./**/*.test.?(c|m)[jt]s?(x)"],
				},
			},
		],
		coverage: {
			enabled: true,
			reportOnFailure: true,
			reportsDirectory: "./.vitest-coverage",
			include: ["app/**", "packages/ui/**", "packages/domains/**"],
			exclude: [
				"**/.next/**/*",
				"**/node_modules/**/*",
				"**/dist/**/*",
				"app/src/generated/**/*",
				"**/*.stories.tsx",
				"**/*.test.ts?(x)",
				"**/types.ts",
				"**/*.interface.ts",
			],
			reporter: ["text", "json-summary", "json"],
		},
	},
});
