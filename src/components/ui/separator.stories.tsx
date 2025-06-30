import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Separator } from "@/components/ui/separator";

const meta = {
	title: "Components/UI/Separator",
	component: Separator,
	tags: ["autodocs"],
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
