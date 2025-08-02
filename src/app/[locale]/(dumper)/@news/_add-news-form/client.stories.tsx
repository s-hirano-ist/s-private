import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { NextIntlClientProvider } from "next-intl";
import { AddNewsFormClient } from "./client";

const meta = {
	component: AddNewsFormClient,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<NextIntlClientProvider
				locale="en"
				messages={{
					label: {
						category: "Category",
						title: "Title",
						description: "Description",
						url: "URL",
						save: "Save",
					},
					message: {
						success: "News added successfully",
						error: "Failed to add news",
					},
				}}
			>
				<div className="w-96">
					<Story />
				</div>
			</NextIntlClientProvider>
		),
	],
	tags: ["autodocs"],
} satisfies Meta<typeof AddNewsFormClient>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockCategories = [
	{ id: 1, name: "Technology" },
	{ id: 2, name: "Business" },
	{ id: 3, name: "Science" },
	{ id: 4, name: "Health" },
	{ id: 5, name: "Sports" },
];

export const Default: Story = {
	args: {
		categories: mockCategories,
		addNews: fn(),
	},
};

export const WithManyCategories: Story = {
	args: {
		categories: [
			...mockCategories,
			{ id: 6, name: "Entertainment" },
			{ id: 7, name: "Politics" },
			{ id: 8, name: "World" },
			{ id: 9, name: "Local" },
			{ id: 10, name: "Opinion" },
		],
		addNews: fn(),
	},
};

export const EmptyCategories: Story = {
	args: {
		categories: [],
		addNews: fn(),
	},
};

export const JapaneseLocale: Story = {
	args: {
		categories: [
			{ id: 1, name: "テクノロジー" },
			{ id: 2, name: "ビジネス" },
			{ id: 3, name: "サイエンス" },
			{ id: 4, name: "健康" },
			{ id: 5, name: "スポーツ" },
		],
		addNews: fn(),
	},
	decorators: [
		(Story) => (
			<NextIntlClientProvider
				locale="ja"
				messages={{
					label: {
						category: "カテゴリー",
						title: "タイトル",
						description: "説明",
						url: "URL",
						save: "保存",
					},
					message: {
						success: "ニュースが正常に追加されました",
						error: "ニュースの追加に失敗しました",
					},
				}}
			>
				<div className="w-96">
					<Story />
				</div>
			</NextIntlClientProvider>
		),
	],
};
