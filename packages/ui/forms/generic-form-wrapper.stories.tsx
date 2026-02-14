import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ClipboardPasteIcon } from "lucide-react";
import { fn } from "storybook/test";
import { FormDropdownInput } from "./fields/form-dropdown-input";
import { FormFileInput } from "./fields/form-file-input";
import { FormInput } from "./fields/form-input";
import { FormInputWithButton } from "./fields/form-input-with-button";
import { FormTextarea } from "./fields/form-textarea";
import { GenericFormWrapper } from "./generic-form-wrapper";

const meta = {
	component: GenericFormWrapper,
	parameters: { layout: "centered" },
	argTypes: {
		submitLabel: { control: { type: "text" } },
		loadingLabel: { control: { type: "text" } },
	},
	args: {
		action: fn().mockImplementation(async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return { message: "success" };
		}),
	},
	decorators: [
		(Story) => (
			<div className="w-96">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof GenericFormWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockCategories = [
	{ id: "1", name: "テクノロジー" },
	{ id: "2", name: "ビジネス" },
	{ id: "3", name: "デザイン" },
];

export const SimpleForm: Story = {
	args: {
		children: (
			<>
				<FormInput
					autoComplete="off"
					htmlFor="title"
					label="タイトル"
					name="title"
					placeholder="タイトルを入力"
					required
				/>
				<FormTextarea
					autoComplete="off"
					htmlFor="description"
					label="説明"
					name="description"
					placeholder="説明を入力"
				/>
			</>
		),
		afterSubmit: fn(),
		saveLabel: "save",
	},
};

export const BookForm: Story = {
	args: {
		children: (
			<>
				<FormInput
					autoComplete="off"
					htmlFor="isbn"
					label="ISBN"
					name="isbn"
					placeholder="978-4-XXXX-XXXX-X"
					required
				/>
				<FormInput
					autoComplete="off"
					htmlFor="title"
					label="タイトル"
					name="title"
					placeholder="本のタイトル"
					required
				/>
			</>
		),
		afterSubmit: fn(),
		saveLabel: "save",
	},
};

export const ArticleForm: Story = {
	parameters: { a11y: { test: "todo" } },
	args: {
		children: (
			<>
				<FormDropdownInput
					htmlFor="category"
					label="カテゴリー"
					name="category"
					options={mockCategories}
					placeholder="カテゴリーを選択"
					required
				/>
				<FormInput
					autoComplete="off"
					htmlFor="title"
					label="タイトル"
					name="title"
					placeholder="ニュースタイトル"
					required
				/>
				<FormTextarea
					autoComplete="off"
					htmlFor="quote"
					label="概要"
					name="quote"
					placeholder="記事の概要"
				/>
				<FormInputWithButton
					autoComplete="off"
					buttonIcon={<ClipboardPasteIcon />}
					buttonTestId="paste-button"
					htmlFor="url"
					inputMode="url"
					label="URL"
					name="url"
					onButtonClick={fn().mockImplementation(async () => {
						const text = await navigator.clipboard.readText();
						return text;
					})}
					placeholder="https://example.com"
					required
					type="url"
				/>
			</>
		),
		afterSubmit: fn(),
		saveLabel: "save",
	},
};

export const ImageUploadForm: Story = {
	args: {
		submitLabel: "upload",
		loadingLabel: "uploading",
		children: (
			<FormFileInput
				accept="image/*"
				htmlFor="files"
				label="画像ファイル"
				multiple
				name="files"
				required
			/>
		),
		afterSubmit: fn(),
		saveLabel: "save",
	},
};

export const ContentForm: Story = {
	args: {
		children: (
			<>
				<FormInput
					autoComplete="off"
					htmlFor="title"
					label="タイトル"
					name="title"
					placeholder="コンテンツタイトル"
					required
				/>
				<FormTextarea
					autoComplete="off"
					className="min-h-[200px]"
					htmlFor="markdown"
					label="マークダウン"
					name="markdown"
					placeholder="マークダウン形式で内容を入力"
					required
				/>
			</>
		),
		afterSubmit: fn(),
		saveLabel: "save",
	},
};

export const CustomLabels: Story = {
	args: {
		submitLabel: "send",
		loadingLabel: "sending",
		children: (
			<>
				<FormInput
					htmlFor="message"
					label="メッセージ"
					name="message"
					placeholder="メッセージを入力"
					required
				/>
			</>
		),
		afterSubmit: fn(),
		saveLabel: "save",
	},
};

export const LongForm: Story = {
	args: {
		children: (
			<>
				<FormInput
					htmlFor="name"
					label="名前"
					name="name"
					placeholder="お名前"
					required
				/>
				<FormInput
					htmlFor="email"
					label="メールアドレス"
					name="email"
					placeholder="email@example.com"
					required
					type="email"
				/>
				<FormInput
					htmlFor="phone"
					label="電話番号"
					name="phone"
					placeholder="090-1234-5678"
					type="tel"
				/>
				<FormTextarea
					htmlFor="message"
					label="お問い合わせ内容"
					name="message"
					placeholder="お問い合わせ内容を入力してください"
					required
				/>
				<FormFileInput
					accept=".pdf,.doc,.docx"
					htmlFor="attachment"
					label="添付ファイル（任意）"
					name="attachment"
				/>
			</>
		),
		afterSubmit: fn(),
		saveLabel: "save",
	},
};
