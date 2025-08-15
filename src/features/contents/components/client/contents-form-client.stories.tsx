import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { ContentsFormClient } from "./contents-form-client";

const meta = {
	component: ContentsFormClient,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ContentsFormClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { addContents: fn() } };
