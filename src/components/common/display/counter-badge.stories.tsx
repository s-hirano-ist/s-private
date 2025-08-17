import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CounterBadge } from "./counter-badge";

const meta = {
	component: CounterBadge,
	tags: ["autodocs"],
} satisfies Meta<typeof CounterBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstPage: Story = {
	args: {
		totalItems: 750,
		label: "totalImages",
	},
};

export const MiddlePage: Story = {
	args: {
		totalItems: 750,
		label: "totalImages",
	},
};

export const LastPage: Story = {
	args: {
		totalItems: 750,
		label: "totalImages",
	},
};
