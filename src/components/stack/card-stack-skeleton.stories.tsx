import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CardStackSkeleton } from "./card-stack-skeleton";

const meta = {
	title: "Components/Stack/CardStackSkeleton",
	component: CardStackSkeleton,
} satisfies Meta<typeof CardStackSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
