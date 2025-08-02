import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RootTab } from "./client";

const meta = {
	component: RootTab,
	parameters: { layout: "fullscreen" },
	tags: ["autodocs"],
} satisfies Meta<typeof RootTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		news: <div>sample news</div>,
		contents: <div>sample contents</div>,
		image: <div>sample image</div>,
		dump: <div>sample dump</div>,
	},
};
