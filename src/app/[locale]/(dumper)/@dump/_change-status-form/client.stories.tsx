import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { ChangeStatusFormClient } from "./client";

const meta = {
	component: ChangeStatusFormClient,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ChangeStatusFormClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		changeContentsStatus: fn(),
		changeImagesStatus: fn(),
		changeNewsStatus: fn(),
	},
};
