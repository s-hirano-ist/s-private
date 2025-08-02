import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { CountBadge } from "./count-badge";

const meta = {
	component: CountBadge,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof CountBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "news",
		total: 42,
	},
	render: (args) => (
		<NextIntlClientProvider
			locale="ja"
			messages={{ label: { news: "ニュース" } }}
		>
			<CountBadge label={args.label} total={args.total} />
		</NextIntlClientProvider>
	),
};

export const LargeCount: Story = {
	args: {
		label: "contents",
		total: 1234,
	},
	render: (args) => (
		<NextIntlClientProvider
			locale="ja"
			messages={{ label: { contents: "コンテンツ" } }}
		>
			<CountBadge label={args.label} total={args.total} />
		</NextIntlClientProvider>
	),
};

export const ZeroCount: Story = {
	args: {
		label: "images",
		total: 0,
	},
	render: (args) => (
		<NextIntlClientProvider
			locale="ja"
			messages={{ label: { images: "画像" } }}
		>
			<CountBadge label={args.label} total={args.total} />
		</NextIntlClientProvider>
	),
};
