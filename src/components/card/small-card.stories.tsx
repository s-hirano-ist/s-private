import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SmallCard } from "./small-card";

const meta = {
	title: "Components/Card/SmallCard",
	component: SmallCard,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof SmallCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 1,
		title: "Sample News Title",
		quote: "This is a sample quote or description for the news item.",
		url: "https://example.com",
		category: "Tech",
		showDeleteButton: false,
	},
};

export const WithDeleteButton: Story = {
	args: {
		id: 2,
		title: "News with Delete Button",
		quote: "This news item has a delete button visible.",
		url: "https://example.com",
		category: "News",
		showDeleteButton: true,
	},
};

export const WithoutCategory: Story = {
	args: {
		id: 3,
		title: "News without Category",
		quote: "This news item doesn't have a category.",
		url: "https://example.com",
		showDeleteButton: false,
	},
};

export const WithoutQuote: Story = {
	args: {
		id: 4,
		title: "News without Quote",
		quote: null,
		url: "https://example.com",
		category: "General",
		showDeleteButton: false,
	},
};

export const LongTitle: Story = {
	args: {
		id: 5,
		title:
			"This is a very long news title that might wrap to multiple lines to test how the component handles longer text content",
		quote:
			"This is also a longer quote to test how the component handles longer description text that might be truncated.",
		url: "https://example.com",
		category: "Long Content",
		showDeleteButton: false,
	},
};
