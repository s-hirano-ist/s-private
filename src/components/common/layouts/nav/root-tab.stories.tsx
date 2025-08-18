import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RootTab } from "./root-tab";

const meta = {
	component: RootTab,
	parameters: { layout: "fullscreen" },
	tags: ["autodocs"],
} satisfies Meta<typeof RootTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		articles: <div>sample articles</div>,
		contents: <div>sample contents</div>,
		images: <div>sample images</div>,
		books: <div>sample books</div>,
	},
};
