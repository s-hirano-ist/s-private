import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Unauthorized } from "./unauthorized";

const meta = {
	component: Unauthorized,
	parameters: { layout: "centered" },
} satisfies Meta<typeof Unauthorized>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
