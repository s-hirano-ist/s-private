import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { defineWorkspace } from "vitest/config";

// More info at: https://storybook.js.org/docs/writing-tests/vitest-plugin
export default defineWorkspace([
	"vitest.config.ts",
	{
		plugins: [
			// // See options at: https://storybook.js.org/docs/writing-tests/vitest-plugin#storybooktest
			storybookTest({ configDir: ".storybook" }),
		],
		test: {
			name: "storybook",
			browser: {
				enabled: true,
				headless: true,
				name: "chromium",
				provider: "playwright",
			},
			// Make sure to adjust this pattern to match your stories files.
			setupFiles: [".storybook/vitest.setup.ts"],
		},
	},
]);
