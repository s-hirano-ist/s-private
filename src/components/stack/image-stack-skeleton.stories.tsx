import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ImageStackSkeleton } from "./image-stack-skeleton";

const meta = {
	title: "Components/Stack/ImageStackSkeleton",
	component: ImageStackSkeleton,
} satisfies Meta<typeof ImageStackSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
