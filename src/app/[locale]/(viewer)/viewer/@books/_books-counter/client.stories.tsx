import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BooksCounterClient } from "./client";

const meta = {
	component: BooksCounterClient,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof BooksCounterClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { totalBooks: 25 } };

export const NoContents: Story = { args: { totalBooks: 0 } };

export const SingleContent: Story = { args: { totalBooks: 1 } };

export const ManyContents: Story = { args: { totalBooks: 999 } };
