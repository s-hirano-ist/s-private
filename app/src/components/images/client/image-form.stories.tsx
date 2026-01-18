import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ImageForm } from "./image-form";

const meta = {
	component: ImageForm,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ImageForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { addImage: fn() },
};
