import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContentsPagination } from "./contents-pagination";

const meta = {
	component: ContentsPagination,
	tags: ["autodocs"],
} satisfies Meta<typeof ContentsPagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstPage: Story = {
	args: { currentPage: 1, totalPages: 32 },
};

export const MiddlePage: Story = {
	args: { currentPage: 2, totalPages: 32 },
};

export const LastPage: Story = {
	args: { currentPage: 3, totalPages: 32 },
};
