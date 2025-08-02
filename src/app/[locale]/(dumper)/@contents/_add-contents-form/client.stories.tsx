import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { NextIntlClientProvider } from "next-intl";
import { AddContentsFormClient } from "./client";

const meta = {
	component: AddContentsFormClient,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<NextIntlClientProvider
				locale="en"
				messages={{
					label: {
						title: "Title",
						description: "Description",
						url: "URL",
						save: "Save",
					},
					message: {
						success: "Content added successfully",
						error: "Failed to add content",
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
} satisfies Meta<typeof AddContentsFormClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { addContents: fn() },
};

export const JapaneseLocale: Story = {
	decorators: [
		(Story) => (
			<NextIntlClientProvider
				locale="ja"
				messages={{
					label: {
						title: "タイトル",
						description: "説明",
						url: "URL",
						save: "保存",
					},
					message: {
						success: "コンテンツが正常に追加されました",
						error: "コンテンツの追加に失敗しました",
					},
				}}
			>
				<div className="w-96">
					<Story />
				</div>
			</NextIntlClientProvider>
		),
	],
	args: { addContents: fn() },
};
