import type { Meta, StoryObj } from "@storybook/react";
import { ChangeStatusButtons } from "./change-status-buttons";

const meta = {
	title: "Features/Dump/ChangeStatusButtons",
	component: ChangeStatusButtons,
	parameters: {
		layout: "centered",
		nextjs: { appDirectory: true },
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ChangeStatusButtons>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
