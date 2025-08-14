import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormInput } from "./form-input";

const meta = {
	component: FormInput,
	parameters: { layout: "centered" },
	argTypes: {
		label: { control: { type: "text" } },
		htmlFor: { control: { type: "text" } },
		name: { control: { type: "text" } },
		placeholder: { control: { type: "text" } },
		required: { control: { type: "boolean" } },
		disabled: { control: { type: "boolean" } },
		type: {
			control: { type: "select" },
			options: ["text", "email", "password", "url", "tel", "number"],
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof FormInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "ユーザー名",
		htmlFor: "username",
		name: "username",
		placeholder: "ユーザー名を入力してください",
	},
};

export const Required: Story = {
	args: {
		label: "メールアドレス (必須)",
		htmlFor: "email",
		name: "email",
		type: "email",
		placeholder: "example@email.com",
		required: true,
	},
};

export const Password: Story = {
	args: {
		label: "パスワード",
		htmlFor: "password",
		name: "password",
		type: "password",
		placeholder: "パスワードを入力",
		required: true,
	},
};

export const URL: Story = {
	args: {
		label: "ウェブサイト",
		htmlFor: "url",
		name: "url",
		type: "url",
		placeholder: "https://example.com",
	},
};

export const Disabled: Story = {
	args: {
		label: "無効化されたフィールド",
		htmlFor: "disabled",
		name: "disabled",
		placeholder: "編集できません",
		disabled: true,
	},
};

export const WithAutoComplete: Story = {
	args: {
		label: "タイトル",
		htmlFor: "title",
		name: "title",
		placeholder: "タイトルを入力",
		autoComplete: "off",
	},
};

export const ISBN: Story = {
	args: {
		label: "ISBN",
		htmlFor: "isbn",
		name: "isbn",
		placeholder: "978-4-XXXX-XXXX-X",
		required: true,
		autoComplete: "off",
	},
};
