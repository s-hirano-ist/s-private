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

		// Backgrounds addon configuration
		backgrounds: {
			default: "white",
			values: [
				{
					name: "white",
					value: "#ffffff",
				},
				{
					name: "light",
					value: "#f8f9fa",
				},
				{
					name: "dark",
					value: "#343a40",
				},
				{
					name: "black",
					value: "#000000",
				},
			],
		},
	},
} satisfies Preview;

export default preview;
