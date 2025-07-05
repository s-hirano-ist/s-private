import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { NextIntlClientProvider } from "next-intl";
import { SearchForm } from "./search-form";

const meta = {
	title: "Features/AI/SearchForm",
	component: SearchForm,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof SearchForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onSearch: fn(),
	},
	render: (args) => {
		return (
			<NextIntlClientProvider locale="ja">
				<SearchForm onSearch={args.onSearch} />
			</NextIntlClientProvider>
		);
	},
};

export const WithInitialQuery: Story = {
	args: {
		initialQuery: "sample search query",
		onSearch: fn(),
	},
	render: (args) => {
		return (
			<NextIntlClientProvider locale="ja">
				<SearchForm initialQuery={args.initialQuery} onSearch={args.onSearch} />
			</NextIntlClientProvider>
		);
	},
};

export const EmptyInitialQuery: Story = {
	args: {
		initialQuery: "",
		onSearch: fn(),
	},
	render: (args) => {
		return (
			<NextIntlClientProvider locale="ja">
				<SearchForm initialQuery={args.initialQuery} onSearch={args.onSearch} />
			</NextIntlClientProvider>
		);
	},
};
