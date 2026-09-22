import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Rating } from "./rating.js";

const meta = {
	component: Rating,
	parameters: { layout: "centered" },
	argTypes: {
		size: { control: "select", options: ["sm", "md", "lg"] },
		maxRating: { control: { type: "number", min: 1 } },
		rating: { control: { type: "number", min: 0 } },
	},
	args: { rating: 3 },
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		await expect(
			within(canvasElement).getByRole("img", { name: "Rating: 3 out of 5" }),
		).toBeInTheDocument();
	},
};

export const Small: Story = { args: { size: "sm" } };
export const Large: Story = { args: { rating: 4, size: "lg" } };
export const TenPointScale: Story = { args: { maxRating: 10, rating: 8 } };
