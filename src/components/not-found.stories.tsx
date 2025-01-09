import type { Meta, StoryObj } from "@storybook/react";
import { NotFound } from "./not-found";

const meta = {
	title: "Components/NotFound",
	component: NotFound,
	parameters: {
		layout: "centered",
		nextjs: { appDirectory: true },
	},
	tags: ["autodocs"],
} satisfies Meta<typeof NotFound>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
