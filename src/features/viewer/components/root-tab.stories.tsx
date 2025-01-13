import type { Meta, StoryObj } from "@storybook/react";
import { RootTab } from "./root-tab";

const meta = {
	title: "Features/Viewer/RootTab",
	component: RootTab,
	tags: ["autodocs"],
} satisfies Meta<typeof RootTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		books: <div>sample books</div>,
		contents: <div>sample contents</div>,
		images: <div>sample image</div>,
	},
};
