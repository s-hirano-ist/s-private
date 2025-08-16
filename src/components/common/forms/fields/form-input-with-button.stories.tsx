import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import {
	ClipboardPasteIcon,
	CopyIcon,
	EyeIcon,
	RefreshCwIcon,
	SearchIcon,
} from "lucide-react";
import { FormInputWithButton } from "./form-input-with-button";

const meta = {
	component: FormInputWithButton,
	parameters: { layout: "centered" },
	argTypes: {
		label: { control: { type: "text" } },
		htmlFor: { control: { type: "text" } },
		name: { control: { type: "text" } },
		placeholder: { control: { type: "text" } },
		type: {
			control: { type: "select" },
			options: ["text", "email", "password", "url", "tel", "number"],
		},
		required: { control: { type: "boolean" } },
		disabled: { control: { type: "boolean" } },
		onButtonClick: { action: "button-clicked" },
	},
	args: {
		onButtonClick: fn(),
	},
	tags: ["autodocs"],
} satisfies Meta<typeof FormInputWithButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "URL",
		htmlFor: "url",
		name: "url",
		type: "url",
		placeholder: "URLを入力してください",
		buttonIcon: <ClipboardPasteIcon />,
		buttonTestId: "paste-button",
		required: true,
	},
};

export const PasteURL: Story = {
	args: {
		label: "ウェブサイトURL",
		htmlFor: "website-url",
		name: "url",
		type: "url",
		placeholder: "https://example.com",
		buttonIcon: <ClipboardPasteIcon />,
		buttonTestId: "paste-button",
		inputMode: "url",
		autoComplete: "off",
		required: true,
	},
};

export const SearchField: Story = {
	args: {
		label: "検索",
		htmlFor: "search",
		name: "search",
		placeholder: "キーワードを入力",
		buttonIcon: <SearchIcon />,
		buttonTestId: "search-button",
	},
};

export const PasswordWithReveal: Story = {
	args: {
		label: "パスワード",
		htmlFor: "password",
		name: "password",
		type: "password",
		placeholder: "パスワードを入力",
		buttonIcon: <EyeIcon />,
		buttonTestId: "reveal-button",
		required: true,
	},
};

export const RefreshableField: Story = {
	args: {
		label: "APIキー",
		htmlFor: "api-key",
		name: "api-key",
		placeholder: "APIキーを生成または入力",
		buttonIcon: <RefreshCwIcon />,
		buttonTestId: "refresh-button",
	},
};

export const CopyField: Story = {
	args: {
		label: "共有リンク",
		htmlFor: "share-link",
		name: "share-link",
		placeholder: "https://example.com/share/...",
		buttonIcon: <CopyIcon />,
		buttonTestId: "copy-button",
		disabled: true,
	},
};

export const EmailWithValidation: Story = {
	args: {
		label: "メールアドレス",
		htmlFor: "email",
		name: "email",
		type: "email",
		placeholder: "user@example.com",
		buttonIcon: <SearchIcon />,
		buttonTestId: "validate-button",
		required: true,
		autoComplete: "email",
	},
};

export const Disabled: Story = {
	args: {
		label: "無効化されたフィールド",
		htmlFor: "disabled",
		name: "disabled",
		placeholder: "編集できません",
		buttonIcon: <ClipboardPasteIcon />,
		disabled: true,
	},
};
