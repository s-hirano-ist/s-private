import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SimpleSearchClient } from "./client";

const meta = {
	component: SimpleSearchClient,
} satisfies Meta<typeof SimpleSearchClient>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
