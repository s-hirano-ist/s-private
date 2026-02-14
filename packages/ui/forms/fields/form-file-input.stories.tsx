import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormFileInput } from "./form-file-input";

const meta = {
	component: FormFileInput,
	parameters: { layout: "centered" },
	argTypes: {
		label: { control: { type: "text" } },
		htmlFor: { control: { type: "text" } },
		name: { control: { type: "text" } },
		accept: { control: { type: "text" } },
		required: { control: { type: "boolean" } },
		disabled: { control: { type: "boolean" } },
		multiple: { control: { type: "boolean" } },
	},
} satisfies Meta<typeof FormFileInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "ファイル",
		htmlFor: "file",
		name: "file",
	},
};

export const Images: Story = {
	args: {
		label: "画像ファイル",
		htmlFor: "image",
		name: "image",
		accept: "image/*",
		required: true,
	},
};

export const MultipleImages: Story = {
	args: {
		label: "複数の画像",
		htmlFor: "files",
		name: "files",
		accept: "image/*",
		multiple: true,
		required: true,
	},
};

export const Documents: Story = {
	args: {
		label: "ドキュメント",
		htmlFor: "document",
		name: "document",
		accept: ".pdf,.doc,.docx,.txt",
	},
};

export const CSVFiles: Story = {
	args: {
		label: "CSVファイル",
		htmlFor: "csv",
		name: "csv",
		accept: ".csv",
		required: true,
	},
};

export const Disabled: Story = {
	args: {
		label: "無効化されたファイル選択",
		htmlFor: "disabled",
		name: "disabled",
		disabled: true,
	},
};

export const Avatar: Story = {
	args: {
		label: "プロフィール画像",
		htmlFor: "avatar",
		name: "avatar",
		accept: "image/jpeg,image/png,image/gif",
	},
};
