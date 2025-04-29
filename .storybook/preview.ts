import type { Preview } from "@storybook/react";
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
	},
} satisfies Preview;

export default preview;
