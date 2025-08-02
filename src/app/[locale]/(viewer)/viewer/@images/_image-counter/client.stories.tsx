import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ImageCounterClient } from "./client";

const meta = {
	component: ImageCounterClient,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ImageCounterClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		page: 1,
		totalImages: 50,
	},
};

export const FirstPage: Story = {
	args: {
		page: 1,
		totalImages: 200,
	},
};

export const MiddlePage: Story = {
	args: {
		page: 10,
		totalImages: 200,
	},
};

export const LastPage: Story = {
	args: {
		page: 20,
		totalImages: 200,
	},
};

export const SingleImage: Story = {
	args: {
		page: 1,
		totalImages: 1,
	},
};

export const NoImages: Story = {
	args: {
		page: 1,
		totalImages: 0,
	},
};
