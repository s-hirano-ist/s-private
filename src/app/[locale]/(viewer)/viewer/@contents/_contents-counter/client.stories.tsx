import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContentsCounterClient } from "./client";

const meta = {
	component: ContentsCounterClient,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ContentsCounterClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { totalContents: 25 } };

export const NoContents: Story = { args: { totalContents: 0 } };

export const SingleContent: Story = { args: { totalContents: 1 } };

export const ManyContents: Story = { args: { totalContents: 999 } };
