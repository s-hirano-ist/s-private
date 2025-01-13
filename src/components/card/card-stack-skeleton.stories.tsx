import type { Meta, StoryObj } from "@storybook/react";
import { CardStackSkeleton } from "./card-stack-skeleton";

const meta = {
	title: "Components/Card/CardStackSkeleton",
	component: CardStackSkeleton,
} satisfies Meta<typeof CardStackSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
