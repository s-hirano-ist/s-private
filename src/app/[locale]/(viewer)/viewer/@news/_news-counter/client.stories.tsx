import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NewsCounterClient } from "./client";

const meta = {
	component: NewsCounterClient,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof NewsCounterClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		page: 1,
		totalNews: 42,
	},
};

export const FirstPage: Story = {
	args: {
		page: 1,
		totalNews: 100,
	},
};

export const MiddlePage: Story = {
	args: {
		page: 5,
		totalNews: 100,
	},
};

export const LastPage: Story = {
	args: {
		page: 10,
		totalNews: 100,
	},
};

export const SingleItem: Story = {
	args: {
		page: 1,
		totalNews: 1,
	},
};

export const NoItems: Story = {
	args: {
		page: 1,
		totalNews: 0,
	},
};
