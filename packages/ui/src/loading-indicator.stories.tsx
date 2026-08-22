import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { LoadingIndicator } from "./loading-indicator.js";

const meta = {
	component: LoadingIndicator,
	parameters: { layout: "centered" },
} satisfies Meta<typeof LoadingIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const dots = canvasElement.querySelectorAll(
			'[data-slot="loading-indicator-dot"]',
		);
		await expect(dots.length).toBe(3);
	},
};
