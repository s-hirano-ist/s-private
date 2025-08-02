import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		"@storybook/addon-links",
		"@chromatic-com/storybook",
		"@storybook/addon-coverage",
		"@storybook/addon-a11y",
		"@storybook/addon-themes",
		// "@storybook/addon-onboarding",
		// "@storybook/addon-actions",
		// "@storybook/addon-backgrounds",
		// "@storybook/addon-controls",
		// "@storybook/addon-viewport",
		// "@storybook/addon-toolbars",
		// "storybook-dark-mode",
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
	staticDirs: ["../public"],
};
export default config;
