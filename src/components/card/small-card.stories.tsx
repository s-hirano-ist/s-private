import type { Meta, StoryObj } from "@storybook/react";
import { SmallCard } from "./small-card";

const meta = {
	title: "Components/Card/SmallCard",
	component: SmallCard,
	tags: ["autodocs"],
	parameters: { layout: "centered" },
} satisfies Meta<typeof SmallCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 1,
		title: "サンプルタイトル",
		quote:
			"Making the `Hello World` page is the first thing you do when start a new programming language.",
		url: "https://example.com",
		category: "サンプルカテゴリー",
	},
};

export const NoQuote: Story = {
	args: {
		id: 1,
		title: "サンプルタイトル",
		quote: "",
		url: "https://example.com",
		category: "サンプルカテゴリー",
	},
};

export const NoCategory: Story = {
	args: {
		id: 1,
		title: "サンプルタイトル",
		quote:
			"Making the `Hello World` page is the first thing you do when start a new programming language.",
		url: "https://example.com",
	},
};
