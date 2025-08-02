import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StaticNewsStackClient } from "./client";

const meta = {
	component: StaticNewsStackClient,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof StaticNewsStackClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		data: [
			{
				id: 1,
				title: "Breaking News: Tech Innovation",
				url: "https://example.com/news/1",
				quote:
					"This is an important quote from the article about the latest tech innovation.",
				ogTitle: "Revolutionary Technology Breakthrough",
				ogDescription:
					"Scientists have made a groundbreaking discovery that could change the future of technology.",
				ogImageUrl: "https://example.com/images/tech-news.jpg",
			},
			{
				id: 2,
				title: "Market Update",
				url: "https://example.com/news/2",
				quote:
					"Markets showed strong performance today with significant gains across sectors.",
				ogTitle: "Stock Market Reaches New Heights",
				ogDescription:
					"Global markets rally as investors show renewed confidence in economic recovery.",
				ogImageUrl: null,
			},
		],
	},
};

export const Empty: Story = {
	args: {
		data: [],
	},
};

export const SingleItem: Story = {
	args: {
		data: [
			{
				id: 1,
				title: "Single News Item",
				url: "https://example.com/news/single",
				quote: "This is a single news item for testing.",
				ogTitle: "Single News Title",
				ogDescription: "Description for a single news item.",
				ogImageUrl: "https://example.com/images/single-news.jpg",
			},
		],
	},
};

export const WithoutOgData: Story = {
	args: {
		data: [
			{
				id: 1,
				title: "News Without OG Data",
				url: "https://example.com/news/no-og",
				quote: "This news item has minimal Open Graph data.",
				ogTitle: null,
				ogDescription: null,
				ogImageUrl: null,
			},
		],
	},
};

export const LongContent: Story = {
	args: {
		data: [
			{
				id: 1,
				title: "News with Long Content",
				url: "https://example.com/news/long",
				quote:
					"This is a very long quote that contains a lot of text to test how the component handles lengthy content. It should properly wrap and maintain readability even when the text is quite extensive. The quote continues with more content to ensure proper display.",
				ogTitle:
					"Very Long Title That Could Potentially Wrap to Multiple Lines in the Display",
				ogDescription:
					"This is a very long description that contains a lot of text to test how the component handles lengthy content. It should properly wrap and maintain readability even when the text is quite extensive.",
				ogImageUrl: "https://example.com/images/long-news.jpg",
			},
		],
	},
};
