import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormTextarea } from "./form-textarea";

const meta = {
	component: FormTextarea,
	parameters: { layout: "centered" },
	argTypes: {
		label: { control: { type: "text" } },
		htmlFor: { control: { type: "text" } },
		name: { control: { type: "text" } },
		placeholder: { control: { type: "text" } },
		required: { control: { type: "boolean" } },
		disabled: { control: { type: "boolean" } },
		rows: { control: { type: "number" } },
	},
} satisfies Meta<typeof FormTextarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "説明",
		htmlFor: "description",
		name: "description",
		placeholder: "説明を入力してください",
	},
};

export const Required: Story = {
	args: {
		label: "コメント (必須)",
		htmlFor: "comment",
		name: "comment",
		placeholder: "コメントを入力してください",
		required: true,
	},
};

export const Markdown: Story = {
	args: {
		label: "マークダウン",
		htmlFor: "markdown",
		name: "markdown",
		placeholder: "マークダウン形式で内容を入力してください",
		className: "min-h-[200px]",
		required: true,
	},
};

export const CustomSize: Story = {
	args: {
		label: "短いメモ",
		htmlFor: "memo",
		name: "memo",
		placeholder: "短いメモを入力",
		rows: 3,
	},
};

export const LargeText: Story = {
	args: {
		label: "長文テキスト",
		htmlFor: "longtext",
		name: "longtext",
		placeholder: "長い文章を入力してください...",
		className: "min-h-[300px]",
	},
};

export const Disabled: Story = {
	args: {
		label: "読み取り専用",
		htmlFor: "readonly",
		name: "readonly",
		placeholder: "編集できません",
		disabled: true,
	},
};

export const Quote: Story = {
	args: {
		label: "引用",
		htmlFor: "quote",
		name: "quote",
		placeholder: "記事の引用や要約を入力",
		autoComplete: "off",
	},
};
