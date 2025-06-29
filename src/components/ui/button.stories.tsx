import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";

const meta = {
	title: "Components/UI/Button",
	component: Button,
	parameters: { layout: "centered" },
	argTypes: {
		disabled: { control: { type: "boolean" } },
		size: {
			control: { type: "select" },
			options: ["default", "sm", "md", "lg", "icon"],
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "ボタン",
	},
};
export const Destructive: Story = {
	args: {
		children: "ボタン",
		variant: "destructive",
	},
};
export const Outline: Story = {
	args: {
		children: "ボタン",
		variant: "outline",
	},
};
export const Secondary: Story = {
	args: {
		children: "ボタン",
		variant: "secondary",
	},
};
export const Ghost: Story = {
	args: {
		children: "ボタン",
		variant: "ghost",
	},
};
export const Link: Story = {
	args: {
		children: "ボタン",
		variant: "link",
	},
};
export const NavSide: Story = {
	args: {
		children: "ボタン",
		variant: "navSide",
		size: "navSide",
	},
};
export const NavCenter: Story = {
	args: {
		children: "+",
		variant: "navCenter",
		size: "navCenter",
	},
};
