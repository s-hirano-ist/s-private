import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Only include Storybook tests when running directly in app directory (not from workspace root)
const isDirectRun = process.cwd().endsWith("/app");

export default defineConfig({
	esbuild: {
		jsx: "automatic",
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest-setup.tsx"],
		include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
		exclude: ["./e2e/**/*"],
		server: { deps: { inline: ["next-auth"] } }, // FIXME: https://github.com/vitest-dev/vitest/issues/4554
		typecheck: {
			enabled: true,
			include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
			tsconfig: "./tsconfig.json",
		},
		projects: isDirectRun
			? [
					{
						extends: true,
						plugins: [
							// The plugin will run tests for the stories defined in your Storybook config
							// See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
							storybookTest({ configDir: "../.storybook" }),
						],
						test: {
							name: "storybook",
							browser: {
								enabled: true,
								headless: true,
								provider: "playwright",
								instances: [{ browser: "chromium" }],
							},
							setupFiles: ["../.storybook/vitest.setup.ts"],
						},
					},
				]
			: undefined,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"s-private-components": path.resolve(__dirname, "../packages/components"),
			"s-private-domains": path.resolve(__dirname, "../packages/domains"),
		},
	},
});
