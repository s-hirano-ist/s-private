import type { Meta, StoryObj } from "@storybook/react";
import { SmallCard } from "./small-card";

const meta = {
	title: "Components/Stack/SmallCard",
	component: SmallCard,
	tags: ["autodocs"],
} satisfies Meta<typeof SmallCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 1,
		title: "サンプルタイトル",
		quote: "Sample quote",
		url: "https://example.com",
		category: "サンプルカテゴリー",
	},
};
