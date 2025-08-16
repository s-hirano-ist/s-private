import type { Meta, StoryObj } from "@storybook/react";
import { Footer } from "./footer";

const meta = {
	component: Footer,
	parameters: {
		layout: "fullscreen",
		backgrounds: {
			default: "light",
		},
		nextjs: {
			appDirectory: true,
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en",
				query: {},
			},
		},
	},
};

export const OnDumperPage: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en",
				query: {},
			},
		},
	},
};

export const OnViewerPage: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en/viewer",
				query: {},
			},
		},
	},
};

export const OnBooksPage: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en/books",
				query: {},
			},
		},
	},
};

export const OnContentsPage: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en/contents",
				query: {},
			},
		},
	},
};

export const WithViewerLayout: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en",
				query: { layout: "viewer" },
			},
		},
	},
};

export const WithDumperLayout: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en",
				query: { layout: "dumper" },
			},
		},
	},
};
