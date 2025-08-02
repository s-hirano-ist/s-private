import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { AddContentsFormClient } from "./client";

const meta = {
	component: AddContentsFormClient,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof AddContentsFormClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { addContents: fn() } };
