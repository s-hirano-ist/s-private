import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { SimpleSearch } from "./simple-search";

const meta = {
	component: SimpleSearch,
} satisfies Meta<typeof SimpleSearch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		searchKnowledge: fn(),
	},
};
