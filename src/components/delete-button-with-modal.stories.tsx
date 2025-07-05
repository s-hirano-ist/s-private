import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { NextIntlClientProvider } from "next-intl";
import { DeleteButtonWithModal } from "./delete-button-with-modal";

const meta = {
	title: "Components/DeleteNewsButtonWithModal",
	component: DeleteButtonWithModal,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof DeleteButtonWithModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 1,
		title: "Sample News Title",
		deleteAction: fn(),
	},
	render: (args) => (
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
			<DeleteButtonWithModal
				deleteAction={args.deleteAction}
				id={args.id}
				title={args.title}
			/>
		</NextIntlClientProvider>
	),
};

export const LongTitle: Story = {
	args: {
		id: 2,
		title:
			"This is a very long news title that might wrap to multiple lines to test how the component handles longer text content in the dialog",
		deleteAction: fn(),
	},
	render: (args) => (
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
			<DeleteButtonWithModal
				deleteAction={args.deleteAction}
				id={args.id}
				title={args.title}
			/>
		</NextIntlClientProvider>
	),
};

export const ShortTitle: Story = {
	args: {
		id: 3,
		title: "Short",
		deleteAction: fn(),
	},
	render: (args) => (
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
			<DeleteButtonWithModal
				deleteAction={args.deleteAction}
				id={args.id}
				title={args.title}
			/>
		</NextIntlClientProvider>
	),
};
