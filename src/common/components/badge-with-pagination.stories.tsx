import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BadgeWithPagination } from "./badge-with-pagination";

const meta = {
	component: BadgeWithPagination,
	tags: ["autodocs"],
} satisfies Meta<typeof BadgeWithPagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstPage: Story = {
	args: {
		currentPage: 1,
		totalItems: 750,
		itemsPerPage: 24,
		label: "totalImages",
	},
};

export const MiddlePage: Story = {
	args: {
		currentPage: 2,
		totalItems: 750,
		itemsPerPage: 24,
		label: "totalImages",
	},
};

export const LastPage: Story = {
	args: {
		currentPage: 32,
		totalItems: 750,
		itemsPerPage: 24,
		label: "totalImages",
	},
};
