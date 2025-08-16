import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Unexpected } from "./unexpected";

const meta = {
	component: Unexpected,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof Unexpected>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		caller: "test caller",
		error: "test error",
	},
};
