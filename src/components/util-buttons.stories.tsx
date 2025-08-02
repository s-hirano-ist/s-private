import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { UtilButtons } from "./util-buttons";

const meta = {
	component: UtilButtons,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof UtilButtons>;

export default meta;

type Story = StoryObj<typeof meta>;

const messages = {
	utils: {
		signOut: "サインアウト",
		language: "言語切替",
		appearance: "外観切替",
		reload: "再読み込み",
	},
};

export const Default: Story = {
	args: {
		handleReload: fn(),
		onSignOutSubmit: fn(),
	},
};
