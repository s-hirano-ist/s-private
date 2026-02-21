import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import Loading from "./loading";

const meta = {
	component: Loading,
	parameters: { layout: "centered" },
} satisfies Meta<typeof Loading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const dots = canvasElement.querySelectorAll(".rounded-full");
		await expect(dots.length).toBe(3);
	},
};
