import type { Meta, StoryObj } from "@storybook/react";
import { BooksFormClient } from "./books-form-client";

const meta = {
	title: "Features/Books/Components/Client/BooksFormClient",
	component: BooksFormClient,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		addBooks: { action: "addBooks" },
	},
} satisfies Meta<typeof BooksFormClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		addBooks: async () => ({ message: "Book added successfully!" }),
	},
};

export const WithError: Story = {
	args: {
		addBooks: async () => {
			throw new Error("Failed to add book");
		},
	},
};
