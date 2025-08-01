import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RootTab } from "./client";

const meta = {
	title: "Features/Viewer/RootTab",
	component: RootTab,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RootTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		news: <div>sample news</div>,
		books: <div>sample books</div>,
		contents: <div>sample contents</div>,
		images: <div>sample image</div>,
	},
};
