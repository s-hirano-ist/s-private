import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { ComboboxField } from "./combobox-field.js";

const meta = { component: ComboboxField } satisfies Meta<typeof ComboboxField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: "category",
		label: "Category",
		options: [
			{ label: "Design", value: "design" },
			{ label: "Engineering", value: "engineering" },
		],
	},
	play: async ({ canvasElement }) => {
		await userEvent.click(within(canvasElement).getByRole("combobox"));
		await expect(
			within(document.body).getByRole("listbox", { name: "Category" }),
		).toBeVisible();
	},
};
