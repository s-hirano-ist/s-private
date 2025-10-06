import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
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
	args: { search: fn() },
};

export const OnArticlesPage: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en",
				query: {},
			},
		},
	},
	args: { search: fn() },
};

export const OnNotesPage: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en/notes",
				query: {},
			},
		},
	},
	args: { search: fn() },
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
	args: { search: fn() },
};

export const OnImagesPage: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en/images",
				query: {},
			},
		},
	},
	args: { search: fn() },
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
	args: { search: fn() },
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
	args: { search: fn() },
};
