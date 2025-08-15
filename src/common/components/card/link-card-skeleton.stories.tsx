import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LinkCardSkeleton } from "./link-card-skeleton";

const meta = {
	component: LinkCardSkeleton,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof LinkCardSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
