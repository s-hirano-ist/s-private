import type { Preview } from "@storybook/nextjs-vite";
// eslint-disable-next-line no-restricted-imports
import "../src/app/globals.css";

const preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},

		nextjs: { appDirectory: true },

		docs: {
			codePanel: true,
		},
	},
} satisfies Preview;

export default preview;
