import type { Meta, StoryObj } from "@storybook/react";
import AnimatedGradientText from "./animated-gradient-text";

const meta = {
	title: "Components/Animata/AnimatedGradientText",
	component: AnimatedGradientText,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof AnimatedGradientText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <AnimatedGradientText>sample text</AnimatedGradientText>,
};
