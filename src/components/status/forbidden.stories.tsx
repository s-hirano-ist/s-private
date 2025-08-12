import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Forbidden } from "./forbidden";

const meta = {
	component: Forbidden,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof Forbidden>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
