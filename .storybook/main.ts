import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwindcss from "@tailwindcss/postcss";

const config: StorybookConfig = {
	stories: [
		"../app/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
		"../packages/components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
	],
	addons: [
		"@storybook/addon-links",
		"@chromatic-com/storybook",
		"@storybook/addon-a11y",
		"@storybook/addon-themes",
		// "@storybook/addon-onboarding",
		// "@storybook/addon-actions",
		// "@storybook/addon-backgrounds",
		// "@storybook/addon-controls",
		// "@storybook/addon-viewport",
		// "@storybook/addon-toolbars",
		// "@storybook/addon-cssresources",
		// "storybook-addon-performance",
		// "@storybook/addon-google-analytics",
		"@storybook/addon-vitest",
		"@storybook/addon-docs",
	],
	framework: {
		name: "@storybook/nextjs-vite",
		options: {},
	},
	features: { experimentalRSC: true },
	staticDirs: ["../app/public"],
	viteFinal: async (config) => {
		config.css = {
			...config.css,
			postcss: {
				plugins: [tailwindcss()],
			},
		};
		return config;
	},
};
export default config;
