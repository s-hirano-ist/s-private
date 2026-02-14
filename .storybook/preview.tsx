import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/nextjs-vite";
import "../packages/ui/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";
import jaMessages from "../app/messages/ja.json";
import { ThemeProvider } from "../packages/ui/providers/theme-provider";
import { Toaster } from "../packages/ui/ui/sonner";

const preview = {
	tags: ["autodocs"],
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
					<NextIntlClientProvider locale="ja" messages={jaMessages}>
						<Toaster />
						<div className="w-96">
							<Story />
						</div>
					</NextIntlClientProvider>
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
		},
	},
} satisfies Preview;

export default preview;
