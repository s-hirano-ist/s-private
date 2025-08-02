import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CountBadge } from "./count-badge";

const meta = {
	component: CountBadge,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof CountBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "news",
		total: 42,
	},
};

export const LargeCount: Story = {
	args: {
		label: "contents",
		total: 1234,
	},
};

export const ZeroCount: Story = {
	args: {
		label: "images",
		total: 0,
	},
};
