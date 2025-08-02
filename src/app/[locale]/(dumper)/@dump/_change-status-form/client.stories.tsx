import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { NextIntlClientProvider } from "next-intl";
import { ChangeStatusFormClient } from "./client";

const meta = {
	component: ChangeStatusFormClient,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<NextIntlClientProvider
				locale="en"
				messages={{
					label: {
						dumpTarget: "Dump Target",
						target: "Select target",
						dumpStatus: "Dump Status",
						status: "Select status",
						send: "Send",
					},
					message: {
						success: "Status changed successfully",
						error: "Failed to change status",
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
} satisfies Meta<typeof ChangeStatusFormClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		changeContentsStatus: fn(),
		changeImagesStatus: fn(),
		changeNewsStatus: fn(),
	},
};

export const JapaneseLocale: Story = {
	decorators: [
		(Story) => (
			<NextIntlClientProvider
				locale="ja"
				messages={{
					label: {
						dumpTarget: "ダンプ対象",
						target: "対象を選択",
						dumpStatus: "ダンプステータス",
						status: "ステータスを選択",
						send: "送信",
					},
					message: {
						success: "ステータスが正常に変更されました",
						error: "ステータスの変更に失敗しました",
					},
				}}
			>
				<div className="w-96">
					<Story />
				</div>
			</NextIntlClientProvider>
		),
	],
	args: {
		changeContentsStatus: fn(),
		changeImagesStatus: fn(),
		changeNewsStatus: fn(),
	},
};
