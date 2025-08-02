import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { NextIntlClientProvider } from "next-intl";
import { AddImageFormClient } from "./client";

const meta = {
	component: AddImageFormClient,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<NextIntlClientProvider
				locale="en"
				messages={{
					label: {
						image: "Image",
						upload: "Upload",
						uploading: "Uploading...",
					},
					message: {
						success: "Image uploaded successfully",
						error: "Failed to upload image",
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
} satisfies Meta<typeof AddImageFormClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { addImage: fn() },
};

export const JapaneseLocale: Story = {
	decorators: [
		(Story) => (
			<NextIntlClientProvider
				locale="ja"
				messages={{
					label: {
						image: "画像",
						upload: "アップロード",
						uploading: "アップロード中...",
					},
					message: {
						success: "画像が正常にアップロードされました",
						error: "画像のアップロードに失敗しました",
					},
				}}
			>
				<div className="w-96">
					<Story />
				</div>
			</NextIntlClientProvider>
		),
	],
	args: { addImage: fn() },
};
