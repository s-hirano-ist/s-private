import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AddFormSkeleton } from "./add-form-skeleton";

const meta = {
	component: AddFormSkeleton,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof AddFormSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

export const WithCategory: Story = {
	args: {
		showCategory: true,
	},
};

export const WithSubmitButton: Story = {
	args: {
		showSubmitButton: true,
	},
};

export const WithCategoryAndSubmitButton: Story = {
	args: {
		showCategory: true,
		showSubmitButton: true,
	},
};
