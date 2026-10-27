import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { ImageWithFallback } from "./image-with-fallback";

const meta = {
	component: ImageWithFallback,
	parameters: { layout: "centered" },
	args: {
		alt: "Example image",
		height: 192,
		src: "/not-found.png",
		width: 192,
	},
} satisfies Meta<typeof ImageWithFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		await expect(
			within(canvasElement).getByRole("img", { name: "Example image" }),
		).toBeInTheDocument();
	},
};

export const MissingSource: Story = { args: { src: null } };
