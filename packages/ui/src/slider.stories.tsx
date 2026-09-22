import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, within } from "storybook/test";
import { Slider } from "./slider.js";

const meta = {
	component: Slider,
	parameters: { layout: "centered" },
	argTypes: {
		disabled: { control: "boolean" },
		max: { control: { type: "number" } },
		min: { control: { type: "number" } },
		step: { control: { type: "number" } },
	},
	args: { "aria-label": "Rating", defaultValue: 3, max: 5, min: 1, step: 1 },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const slider = within(canvasElement).getByRole("slider", {
			name: "Rating",
		});
		await fireEvent.change(slider, { target: { value: "4" } });
		await expect(slider).toHaveValue("4");
	},
};

export const Disabled: Story = {
	args: { disabled: true },
	play: async ({ canvasElement }) => {
		await expect(within(canvasElement).getByRole("slider")).toBeDisabled();
	},
};
