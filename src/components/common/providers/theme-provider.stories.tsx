import type { Meta, StoryObj } from "@storybook/react";
import { ThemeProvider } from "./theme-provider";

type ThemeProviderWrapperProps = {
	theme?: string;
	enableSystem?: boolean;
	children?: React.ReactNode;
};

function ThemeProviderWrapper({
	theme = "light",
	enableSystem = true,
	children,
}: ThemeProviderWrapperProps) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme={theme}
			enableSystem={enableSystem}
		>
			{children || (
				<div className="p-6 space-y-4">
					<h1 className="text-2xl font-bold">Theme Provider Test</h1>
					<p className="text-muted-foreground">
						This content is wrapped in a ThemeProvider.
					</p>
					<div className="flex gap-2">
						<div className="p-3 bg-background border rounded">
							Background Color
						</div>
						<div className="p-3 bg-primary text-primary-foreground rounded">
							Primary Color
						</div>
						<div className="p-3 bg-secondary text-secondary-foreground rounded">
							Secondary Color
						</div>
					</div>
				</div>
			)}
		</ThemeProvider>
	);
}

const meta = {
	component: ThemeProviderWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		theme: {
			control: { type: "select", options: ["light", "dark", "system"] },
		},
		enableSystem: { control: "boolean" },
	},
} satisfies Meta<typeof ThemeProviderWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		theme: "light",
		enableSystem: true,
	},
};

export const DarkTheme: Story = {
	args: {
		theme: "dark",
		enableSystem: true,
	},
	parameters: {
		backgrounds: { default: "dark" },
	},
};

export const SystemTheme: Story = {
	args: {
		theme: "system",
		enableSystem: true,
	},
};

export const SystemDisabled: Story = {
	args: {
		theme: "light",
		enableSystem: false,
	},
};

export const WithCustomContent: Story = {
	args: {
		theme: "light",
		enableSystem: true,
		children: (
			<div className="p-8 space-y-6">
				<h2 className="text-3xl font-bold tracking-tight">Custom Content</h2>
				<div className="grid grid-cols-2 gap-4">
					<div className="p-4 bg-card text-card-foreground border rounded-lg">
						<h3 className="font-semibold mb-2">Card Component</h3>
						<p className="text-sm text-muted-foreground">
							This card adapts to the theme.
						</p>
					</div>
					<div className="p-4 bg-muted text-muted-foreground rounded-lg">
						<h3 className="font-semibold mb-2">Muted Section</h3>
						<p className="text-sm">Secondary content area.</p>
					</div>
				</div>
				<button
					className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
					type="button"
				>
					Theme-aware Button
				</button>
			</div>
		),
	},
};
