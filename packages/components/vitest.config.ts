import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest-setup.tsx"],
		coverage: {
			enabled: true,
			reportOnFailure: true,
			reportsDirectory: "./.vitest-coverage",
			include: ["src/**"],
			exclude: [
				"**/*.stories.tsx",
				"src/**/*.test.ts?(x)",
				"src/generated/**/*",
				"src/app/**/?(layout|page|global-error|error).tsx",
				"src/app/\\[locale\\]/forbidden.tsx",
				"src/app/api/auth/\\[...nextauth\\]/route.ts",
				"src/?(instrumentation-client|instrumentation|minio|middleware|pino|prisma).ts",
				"src/app/?(manifest.ts|loading.tsx|robots.ts|not-found.tsx|instrumentation.ts)",
				"src/app/api/sign-in/route.ts",
				"src/env.ts",
				"src/infrastructures/observability/**/*.ts",
				"src/infrastructures/i18n/**/*.ts",
				"src/infrastructures/auth/**/*.ts",
				"**/types.ts",
				"src/domains/**/repositories/*.ts",
				"src/domains/**/types/*.ts",
			],
			reporter: ["text", "json-summary", "json"],
		},
		include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
		exclude: ["./e2e/**/*"],
		server: { deps: { inline: ["next-auth"] } }, // FIXME: https://github.com/vitest-dev/vitest/issues/4554
		typecheck: {
			enabled: true,
			include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
			tsconfig: "./tsconfig.json",
		},
		projects: [
			{
				extends: true,
				plugins: [
					// The plugin will run tests for the stories defined in your Storybook config
					// See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
					storybookTest({ configDir: ".storybook" }),
				],
				test: {
					name: "storybook",
					browser: {
						enabled: true,
						headless: true,
						provider: "playwright",
						instances: [{ browser: "chromium" }],
					},
					setupFiles: [".storybook/vitest.setup.ts"],
				},
			},
		],
	},
	resolve: { alias: { "@": "/src" } },
});
