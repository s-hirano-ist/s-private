import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTheme } from "next-themes";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ThemeProvider } from "./theme-provider";

const STORYBOOK_CSP_NONCE = "storybook-csp-nonce";

function observeAddedStyleElements(): {
	disconnect: () => void;
	styles: HTMLStyleElement[];
} {
	const styles: HTMLStyleElement[] = [];
	const observer = new MutationObserver((records) => {
		for (const record of records) {
			for (const node of record.addedNodes) {
				if (node instanceof HTMLStyleElement) styles.push(node);
			}
		}
	});
	observer.observe(document.head, { childList: true });

	return { disconnect: () => observer.disconnect(), styles };
}

type ThemeProviderWrapperProps = {
	theme?: string;
	enableSystem?: boolean;
	children?: React.ReactNode;
};

function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();

	return (
		<button
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
			type="button"
		>
			Toggle theme
		</button>
	);
}

function ThemeProviderWrapper({
	theme = "light",
	enableSystem = true,
	children,
}: ThemeProviderWrapperProps) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme={theme}
			disableTransitionOnChange
			enableSystem={enableSystem}
			nonce={STORYBOOK_CSP_NONCE}
		>
			{children || (
				<div className="space-y-4 p-6">
					<h1 className="text-2xl font-bold">Theme Provider Test</h1>
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
					<ThemeToggle />
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const styleObserver = observeAddedStyleElements();
		const toggle = canvas.getByRole("button", { name: "Toggle theme" });
		const initialThemeClassName = document.documentElement.className;

		try {
			await userEvent.click(toggle);

			await waitFor(() =>
				expect(
					styleObserver.styles.some(
						(style) => style.nonce === STORYBOOK_CSP_NONCE,
					),
				).toBe(true),
			);
		} finally {
			styleObserver.disconnect();
			await userEvent.click(toggle);
			await waitFor(() =>
				expect(document.documentElement.className).toBe(initialThemeClassName),
			);
		}
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
				<h2 className="text-3xl font-bold tracking-tight">Custom Content</h2>
				<div className="grid grid-cols-2 gap-4">
					<div className="rounded-lg border p-4 text-primary">
						<h3 className="mb-2 font-semibold">Card Component</h3>
						<p className="text-sm text-muted-foreground">
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
