import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const configDirectory = fileURLToPath(
	new URL("./packages/ui/.storybook", import.meta.url),
);
const packageRoot = fileURLToPath(new URL("./packages/ui", import.meta.url));

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
