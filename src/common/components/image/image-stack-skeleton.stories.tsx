import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ImageStackSkeleton } from "./image-stack-skeleton";

const meta = {
	component: ImageStackSkeleton,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ImageStackSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
