import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ImageCardSkeleton } from "./image-card-skeleton";

const meta = {
	component: ImageCardSkeleton,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ImageCardSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
