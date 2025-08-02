import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { CardStack } from "./card-stack";

const meta = {
	component: CardStack,
	parameters: { layout: "fullscreen" },
	tags: ["autodocs"],
} satisfies Meta<typeof CardStack>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockData = [
	{
		id: 1,
		title: "First News Item",
		quote: "This is the first news item with a quote.",
		url: "https://example.com/1",
		category: "Tech",
	},
	{
		id: 2,
		title: "Second News Item",
		quote: "This is the second news item.",
		url: "https://example.com/2",
		category: "News",
	},
	{
		id: 3,
		title: "Third News Item",
		quote: null,
		url: "https://example.com/3",
		category: "General",
	},
];

export const Default: Story = {
	args: {
		data: mockData,
		showDeleteButton: false,
	},
};

export const WithDeleteButton: Story = {
	args: {
		data: mockData,
		showDeleteButton: true,
	},
};

export const EmptyData: Story = {
	args: {
		data: [],
		showDeleteButton: false,
	},
	render: (args) => {
		return (
			<NextIntlClientProvider
				locale="ja"
				messages={{
					label: {
						delete: "削除",
						confirmDelete: "本当に削除しますか？",
						cancel: "キャンセル",
					},
				}}
			>
				<CardStack data={args.data} showDeleteButton={args.showDeleteButton} />
			</NextIntlClientProvider>
		);
	},
};

export const SingleItem: Story = {
	args: {
		data: [mockData[0]],
		showDeleteButton: false,
	},
};

export const ManyItems: Story = {
	args: {
		data: [
			...mockData,
			{
				id: 4,
				title: "Fourth News Item",
				quote: "This is the fourth news item to test grid layout.",
				url: "https://example.com/4",
				category: "Sports",
			},
			{
				id: 5,
				title: "Fifth News Item",
				quote:
					"This is the fifth news item with a longer description to test text truncation and wrapping behavior.",
				url: "https://example.com/5",
			},
		],
		showDeleteButton: false,
	},
};
