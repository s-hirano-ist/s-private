import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Footer } from "./footer";

const meta = {
	component: Footer,
	parameters: {
		layout: "fullscreen",
		nextjs: {
			appDirectory: true,
		},
	},
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en/articles",
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
				pathname: "/en/articles",
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
				pathname: "/en/articles/viewer",
				query: {},
			},
		},
	},
	args: { search: fn() },
};

export const WithDumperLayout: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en/articles",
				query: {},
			},
		},
	},
	args: { search: fn() },
};

export const SwitchToViewer: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en/articles",
				query: {},
			},
		},
		a11y: { disable: true },
	},
	args: { search: fn() },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const viewerText = canvas.getByText("VIEWER");
		await userEvent.click(viewerText);

		await waitFor(() => {
			const viewerContainer = viewerText.closest("div.grid");
			expect(viewerContainer).toBeInTheDocument();
		});
	},
};

export const OpenSearchDrawer: Story = {
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en/articles",
				query: {},
			},
		},
		a11y: { disable: true },
	},
	args: { search: fn() },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const searchButton = canvas.getByRole("button", { name: "Action" });
		await userEvent.click(searchButton);

		await waitFor(
			() =>
				expect(within(document.body).getByText("Search")).toBeInTheDocument(),
			{ timeout: 5000 },
		);
	},
};
