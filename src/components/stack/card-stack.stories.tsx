import type { Meta, StoryObj } from "@storybook/react";
import { NextIntlClientProvider } from "next-intl";
import { CardStack } from "./card-stack";

const meta = {
	title: "Components/Stack/CardStack",
	component: CardStack,
	tags: ["autodocs"],
} satisfies Meta<typeof CardStack>;

export default meta;

type Story = StoryObj<typeof meta>;

const data = [
	{
		id: 1,
		title: "sample title 1",
		quote: "sample quote 1",
		url: "https://example.com",
		category: "cat 1",
	},
	{
		id: 2,
		title: "sample title 2",
		quote: "sample quote 2",
		url: "https://example.com",
		category: "cat 2",
	},
	{
		id: 3,
		title: "sample title 3",
		quote: "sample quote 3",
		url: "https://example.com",
		category: "cat 3",
	},
];

export const Default: Story = {
	args: { data },
};

export const NoData: Story = {
	args: { data: [] },
	render: () => (
		<NextIntlClientProvider locale="ja">
			<CardStack data={data} />
		</NextIntlClientProvider>
	),
};
