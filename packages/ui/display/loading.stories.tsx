import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import Loading from "./loading";

const meta = {
	component: Loading,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof Loading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const svg = canvasElement.querySelector("svg");
		await expect(svg).toBeInTheDocument();
		await expect(svg).toHaveClass("animate-spin");
	},
};
