import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { DeleteButtonWithModal } from "@/components/common/forms/actions/delete-button-with-modal";
import { LinkCard } from "./link-card";

const meta = {
	component: LinkCard,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof LinkCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		data: {
			id: "1",
			key: "1",
			title: "Sample Title",
			description: "This is a sample description for the article.",
			href: "https://example.com",
			primaryBadgeText: "Tech",
			secondaryBadgeText: "example.com",
		},
	},
};

export const WithDeleteButton: Story = {
	parameters: { a11y: { test: "todo" } },
	args: {
		data: {
			id: "2",
			key: "2",
			title: "article with Delete Button",
			description: "This article has a delete button visible.",
			href: "https://example.com",
			primaryBadgeText: "Tech",
			secondaryBadgeText: "example.com",
		},
	},
	render: (args) => (
		<LinkCard
			{...args}
			actions={
				<DeleteButtonWithModal
					deleteAction={fn()}
					id={args.data.id}
					title={args.data.title}
				/>
			}
		/>
	),
};

export const WithoutBadgeText: Story = {
	args: {
		data: {
			id: "3",
			key: "3",
			title: "article without Badge Text",
			description: "This article doesn't have a category.",
			href: "https://example.com",
		},
	},
};

export const WithoutDescription: Story = {
	args: {
		data: {
			id: "4",
			key: "4",
			title: "article without Description",
			href: "https://example.com",
			primaryBadgeText: "Tech",
			secondaryBadgeText: "example.com",
		},
	},
};

export const LongTitle: Story = {
	args: {
		data: {
			id: "5",
			key: "5",
			title:
				"This is a very long article title that might wrap to multiple lines to test how the component handles longer text content",
			description:
				"This is also a longer description to test how the component handles longer description text that might be truncated.",
			href: "https://example.com",
			primaryBadgeText: "Tech",
			secondaryBadgeText: "example.com",
		},
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
	},
};
