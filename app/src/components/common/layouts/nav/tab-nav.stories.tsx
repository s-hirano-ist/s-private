import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { TabNav, TabNavFallback } from "./tab-nav";

const meta = {
	component: TabNav,
	parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
} satisfies Meta<typeof TabNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Articles: Story = {
	parameters: { nextjs: { navigation: { pathname: "/en/articles" } } },
	play: async ({ canvasElement }) => {
		await expect(
			within(canvasElement).getByText("ARTICLES"),
		).toBeInTheDocument();
	},
};

export const Viewer: Story = {
	parameters: {
		nextjs: { navigation: { pathname: "/en/books/viewer" } },
	},
};

export const Fallback: StoryObj<typeof TabNavFallback> = {
	render: () => <TabNavFallback />,
};
