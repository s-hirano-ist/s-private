import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { defineConfig } from "vitest/config";

const packageRoot = path.resolve(import.meta.dirname, "packages/ui");
const configDirectory = path.join(packageRoot, ".storybook");

export default defineConfig({
	plugins: [storybookTest({ configDir: configDirectory })],
	test: {
		root: packageRoot,
		browser: {
			enabled: true,
			headless: true,
			provider: playwright(),
			instances: [{ browser: "chromium" }],
		},
	},
});
