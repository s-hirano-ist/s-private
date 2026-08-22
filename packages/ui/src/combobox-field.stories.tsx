import type { Meta, StoryObj } from "@storybook/react-vite";
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
};
