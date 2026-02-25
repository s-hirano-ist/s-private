import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/nextjs-vite";
import "../packages/ui/globals.css";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";
import enMessages from "../app/messages/en.json";
import jaMessages from "../app/messages/ja.json";
import { ThemeProvider } from "../packages/ui/providers/theme-provider";
import { Toaster } from "../packages/ui/ui/sonner";

const messages = { en: enMessages, ja: jaMessages };

const preview = {
	tags: ["autodocs", "a11y-test"],
	initialGlobals: {
		backgrounds: { value: "white" },
	},
	decorators: [
		withThemeByClassName({
			themes: {
				light: "",
				dark: "dark",
			},
			defaultTheme: "light",
		}),
		(Story) => {
			return (
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem={false}
				>
					<Toaster />
					<div className="w-96">
						<Story />
					</div>
				</ThemeProvider>
			);
		},
	],
	parameters: {
		controls: {
			expanded: true,
			sort: "requiredFirst",
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},

		nextjs: { appDirectory: true },

		docs: {
			codePanel: true,
		},

		backgrounds: {
			options: {
				white: { name: "White", value: "#ffffff" },
				light: { name: "Light", value: "#f8f9fa" },
				dark: { name: "Dark", value: "#343a40" },
				black: { name: "Black", value: "#000000" },
			},
		},

		viewport: {
			options: MINIMAL_VIEWPORTS,
		},

		a11y: {
			test: "error",
			options: {
				rules: {
					"html-has-lang": { enabled: true },
					"html-lang-valid": { enabled: true },
					"color-contrast": { enabled: true },
					"image-alt": { enabled: true },
					label: { enabled: true },
					"landmark-unique": { enabled: true },
				},
			},
			config: {
				rules: [{ id: "region", enabled: false }],
			},
		},

		nextIntl: {
			defaultLocale: "ja",
			locales: ["ja", "en"],
			messagesByLocale: messages,
		},
	},
} satisfies Preview;

export default preview;
