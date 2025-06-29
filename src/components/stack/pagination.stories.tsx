import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Pagination } from "./pagination";

const meta = {
	title: "Components/Stack/Pagination",
	component: Pagination,
	tags: ["autodocs"],
} satisfies Meta<typeof Pagination>;

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
