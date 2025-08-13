import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { AddImageFormClient } from "./client";

const meta = {
	component: AddImageFormClient,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof AddImageFormClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { addImage: fn() },
};
