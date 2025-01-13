import { Separator } from "@/components/ui/separator";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "Components/UI/Separator",
	component: Separator,
	tags: ["autodocs"],
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
