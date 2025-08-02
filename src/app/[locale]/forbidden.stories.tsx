import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ForbiddenPage from "./forbidden";

const meta = {
	component: ForbiddenPage,
	parameters: { layout: "centered" },
} satisfies Meta<typeof ForbiddenPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
