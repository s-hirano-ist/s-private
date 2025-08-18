import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { DeleteButtonWithModal } from "./delete-button-with-modal";

const meta = {
	component: DeleteButtonWithModal,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof DeleteButtonWithModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: "1",
		title: "Sample Article Title",
		deleteAction: fn(),
	},
};

export const LongTitle: Story = {
	args: {
		id: "2",
		title:
			"This is a very long article title that might wrap to multiple lines to test how the component handles longer text content in the dialog",
		deleteAction: fn(),
	},
};

export const ShortTitle: Story = {
	args: {
		id: "3",
		title: "Short",
		deleteAction: fn(),
	},
};
