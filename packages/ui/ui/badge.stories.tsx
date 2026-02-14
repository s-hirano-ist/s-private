import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";

const meta = {
	component: Badge,
	parameters: { layout: "centered" },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "ボタン",
	},
};

export const Secondary: Story = {
	args: {
		children: "ボタン",
		variant: "secondary",
	},
};

export const Destructive: Story = {
	args: {
		children: "ボタン",
		variant: "destructive",
	},
};

export const Outline: Story = {
	args: {
		children: "ボタン",
		variant: "outline",
	},
};
