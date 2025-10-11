import { defineConfig } from "vitest/config";

/**
 * Vitest Workspace Configuration
 * Integrates test suites across app and packages using test.projects
 */
export default defineConfig({
	test: {
		projects: [
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
				extends: "./packages/components/vitest.config.ts",
				test: {
					name: "components",
					root: "./packages/components",
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
			include: ["app/**", "packages/components/**", "packages/domains/**"],
			exclude: [
				"**/.next/**/*",
				"**/node_modules/**/*",
				"**/dist/**/*",
				"app/src/generated/**/*",
				"**/*.stories.tsx",
				"**/*.test.ts?(x)",
			],
			reporter: ["text", "json-summary", "json"],
		},
	},
});
