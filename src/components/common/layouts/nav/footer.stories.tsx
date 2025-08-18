import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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

export const OnArticlesPage: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en",
				query: {},
			},
		},
	},
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

export const OnImagesPage: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en/images",
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
