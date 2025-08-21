import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotFound } from "./not-found";

const meta = {
	component: NotFound,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof NotFound>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: "コンテンツが見つかりません",
		returnHomeText: "ホームに戻る",
	},
};
