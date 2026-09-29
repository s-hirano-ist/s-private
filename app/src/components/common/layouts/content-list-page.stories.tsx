import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { ContentListPage } from "./content-list-page";

const meta = {
	component: ContentListPage,
	args: { stack: <div>記事一覧</div> },
} satisfies Meta<typeof ContentListPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dumper: Story = {
	play: async ({ canvas }) => {
		await expect(await canvas.findByText("記事一覧")).toBeVisible();
		await expect(canvas.queryByText("公開済み 3 件")).not.toBeInTheDocument();
	},
};

export const Viewer: Story = {
	args: {
		counter: <div>公開済み 3 件</div>,
	},
	play: async ({ canvas }) => {
		await expect(await canvas.findByText("公開済み 3 件")).toBeVisible();
		await expect(await canvas.findByText("記事一覧")).toBeVisible();
	},
};
