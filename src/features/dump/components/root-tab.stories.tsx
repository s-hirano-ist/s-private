import type { Meta, StoryObj } from "@storybook/react";
import { RootTab } from "./root-tab";

const meta = {
	title: "Features/Dump/RootTab",
	component: RootTab,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof RootTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		news: <div>sample news</div>,
		contents: <div>sample contents</div>,
		dump: <div>sample dump</div>,
		image: <div>sample image</div>,
	},
};
