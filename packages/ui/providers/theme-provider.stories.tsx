import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
				<div className="space-y-4 p-6">
					<h1 className="font-bold text-2xl">Theme Provider Test</h1>
					<p className="text-muted-foreground">
						This content is wrapped in a ThemeProvider.
					</p>
					<div className="flex gap-2">
						<div className="rounded border bg-background p-3">
							Background Color
						</div>
						<div className="rounded bg-primary p-3 text-primary-foreground">
							Primary Color
						</div>
						<div className="rounded bg-muted p-3 text-muted-foreground">
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
	globals: {
		backgrounds: { value: "dark" },
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
			<div className="space-y-6 p-8">
				<h2 className="font-bold text-3xl tracking-tight">Custom Content</h2>
				<div className="grid grid-cols-2 gap-4">
					<div className="rounded-lg border p-4 text-primary">
						<h3 className="mb-2 font-semibold">Card Component</h3>
						<p className="text-muted-foreground text-sm">
							This card adapts to the theme.
						</p>
					</div>
					<div className="rounded-lg bg-muted p-4 text-muted-foreground">
						<h3 className="mb-2 font-semibold">Muted Section</h3>
						<p className="text-sm">Secondary content area.</p>
					</div>
				</div>
				<button
					className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
					type="button"
				>
					Theme-aware Button
				</button>
			</div>
		),
	},
};
