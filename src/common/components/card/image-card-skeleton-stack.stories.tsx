import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ImageCardSkeletonStack } from "./image-card-skeleton-stack";

const meta = {
	component: ImageCardSkeletonStack,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ImageCardSkeletonStack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
