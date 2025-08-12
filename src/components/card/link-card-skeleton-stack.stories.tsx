import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LinkCardSkeletonStack } from "./link-card-skeleton-stack";

const meta = {
	component: LinkCardSkeletonStack,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof LinkCardSkeletonStack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
