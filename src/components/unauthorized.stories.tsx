import type { Meta, StoryObj } from "@storybook/react";
import { Unauthorized } from "./unauthorized";

const meta = {
	title: "Components/Unauthorized",
	component: Unauthorized,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof Unauthorized>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
