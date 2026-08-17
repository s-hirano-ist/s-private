import type { Preview } from "@storybook/react-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import "../src/styles.css";

const preview: Preview = {
	tags: ["autodocs", "a11y-test"],
	decorators: [
		withThemeByClassName({
			themes: { light: "", dark: "dark" },
			defaultTheme: "light",
		}),
		(Story) => (
			<div className="mx-auto w-full max-w-xl p-6">
				<Story />
			</div>
		),
	],
	parameters: {
		a11y: { test: "error" },
		controls: { expanded: true, sort: "requiredFirst" },
		docs: { codePanel: true },
	},
};

export default preview;
