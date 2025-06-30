import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SmallCardSkeleton } from "./small-card-skeleton";

const meta = {
	title: "Components/Card/SmallCardSkeleton",
	component: SmallCardSkeleton,
	parameters: { layout: "centered" },
} satisfies Meta<typeof SmallCardSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
