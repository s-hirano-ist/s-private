import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { AddFormSkeleton } from "./add-form-skeleton";

const meta = {
	title: "Features/Dump/AddFormSkeleton",
	component: AddFormSkeleton,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof AddFormSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
	render: () => {
		return (
			<NextIntlClientProvider locale="ja">
				<AddFormSkeleton />
			</NextIntlClientProvider>
		);
	},
};

export const WithCategory: Story = {
	args: {
		showCategory: true,
	},
	render: (args) => {
		return (
			<NextIntlClientProvider locale="ja">
				<AddFormSkeleton showCategory={args.showCategory} />
			</NextIntlClientProvider>
		);
	},
};

export const WithSubmitButton: Story = {
	args: {
		showSubmitButton: true,
	},
	render: (args) => {
		return (
			<NextIntlClientProvider locale="ja">
				<AddFormSkeleton showSubmitButton={args.showSubmitButton} />
			</NextIntlClientProvider>
		);
	},
};

export const WithCategoryAndSubmitButton: Story = {
	args: {
		showCategory: true,
		showSubmitButton: true,
	},
	render: (args) => {
		return (
			<NextIntlClientProvider locale="ja">
				<AddFormSkeleton
					showCategory={args.showCategory}
					showSubmitButton={args.showSubmitButton}
				/>
			</NextIntlClientProvider>
		);
	},
};
