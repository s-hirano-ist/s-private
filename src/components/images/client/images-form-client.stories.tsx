import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { ImagesFormClient } from "./images-form-client";

const meta = {
	component: ImagesFormClient,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ImagesFormClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { addImage: fn() },
};
