import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { LinkCard } from "./link-card";

const meta = {
	component: LinkCard,
	parameters: { layout: "fullscreen" },
	tags: ["autodocs"],
} satisfies Meta<typeof LinkCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		data: {
			id: "1",
			key: "1",
			title: "Sample Title",
			description: "This is a sample description for the news item.",
			href: "https://example.com",
			primaryBadgeText: "Tech",
			secondaryBadgeText: "example.com",
		},
		showDeleteButton: false,
	},
};

export const WithDeleteButton: Story = {
	args: {
		data: {
			id: "2",
			key: "2",
			title: "News with Delete Button",
			description: "This news item has a delete button visible.",
			href: "https://example.com",
			primaryBadgeText: "Tech",
			secondaryBadgeText: "example.com",
		},
		showDeleteButton: true,
		deleteAction: fn(),
	},
};

export const WithoutBadgeText: Story = {
	args: {
		data: {
			id: "3",
			key: "3",
			title: "News without Badge Text",
			description: "This news item doesn't have a category.",
			href: "https://example.com",
		},
		showDeleteButton: false,
	},
};

export const WithoutDescription: Story = {
	args: {
		data: {
			id: "4",
			key: "4",
			title: "News without Description",
			href: "https://example.com",
			primaryBadgeText: "Tech",
			secondaryBadgeText: "example.com",
		},
		showDeleteButton: false,
	},
};

export const LongTitle: Story = {
	args: {
		data: {
			id: "5",
			key: "5",
			title:
				"This is a very long news title that might wrap to multiple lines to test how the component handles longer text content",
			description:
				"This is also a longer description to test how the component handles longer description text that might be truncated.",
			href: "https://example.com",
			primaryBadgeText: "Tech",
			secondaryBadgeText: "example.com",
		},
		showDeleteButton: false,
	},
};

export const InternalLink: Story = {
	args: {
		data: {
			id: "6",
			key: "6",
			title: "Internal Link Example",
			description: "This links to an internal page using Next.js routing.",
			href: "/viewer",
			primaryBadgeText: "Tech",
			secondaryBadgeText: "example.com",
		},
		showDeleteButton: false,
	},
};

export const ExternalLink: Story = {
	args: {
		data: {
			id: "7",
			key: "7",
			title: "External Link Example",
			description: "This opens in a new tab with target=_blank.",
			href: "https://nextjs.org",
			primaryBadgeText: "Tech",
			secondaryBadgeText: "example.com",
		},
		showDeleteButton: false,
	},
};

export const InvalidUrl: Story = {
	args: {
		data: {
			id: "8",
			key: "8",
			title: "Invalid URL Example",
			description: "This has an invalid URL and should fallback to home.",
			href: "javascript:alert('xss')",
			primaryBadgeText: "Tech",
			secondaryBadgeText: "example.com",
		},
		showDeleteButton: false,
	},
};
