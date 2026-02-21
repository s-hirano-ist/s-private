import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LazyTabContent } from "./lazy-tab-content";

const meta = {
	component: LazyTabContent,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof LazyTabContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const VisibleTab: Story = {
	args: {
		tabName: "articles",
		children: <div className="rounded border p-4">Tab Content</div>,
	},
	parameters: {
		nextjs: {
			navigation: { pathname: "/en", query: { tab: "articles" } },
		},
	},
};

export const DefaultTabVisible: Story = {
	args: {
		tabName: "articles",
		children: (
			<div className="rounded border p-4">
				Default Tab Content (no tab param defaults to articles)
			</div>
		),
	},
	parameters: {
		nextjs: {
			navigation: { pathname: "/en", query: {} },
		},
	},
};

export const HiddenTab: Story = {
	args: {
		tabName: "books",
		children: <div className="rounded border p-4">Books Content</div>,
	},
	parameters: {
		nextjs: {
			navigation: { pathname: "/en", query: { tab: "articles" } },
		},
	},
};

export const WithFallback: Story = {
	args: {
		tabName: "books",
		children: <div className="rounded border p-4">Books Content</div>,
		fallback: (
			<div className="rounded border border-dashed p-4 text-muted-foreground">
				Loading books...
			</div>
		),
	},
	parameters: {
		nextjs: {
			navigation: { pathname: "/en", query: { tab: "articles" } },
		},
	},
};

export const LazyStrategy: Story = {
	args: {
		tabName: "images",
		children: <div className="rounded border p-4">Images Content</div>,
		loadingStrategy: "lazy",
	},
	parameters: {
		nextjs: {
			navigation: { pathname: "/en", query: { tab: "articles" } },
		},
	},
};
