import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { UtilButtons } from "./util-buttons";

const meta = {
	title: "Components/UtilButtons",
	component: UtilButtons,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof UtilButtons>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		handleReload: fn(),
		onSignOutSubmit: fn(),
	},
};
