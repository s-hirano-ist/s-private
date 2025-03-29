import { Label } from "@/components/ui/label";
import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta = {
	title: "Components/UI/Label",
	component: Label,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <Label htmlFor="input-id">Default Label</Label>,
};

export const WithCustomClass: Story = {
	render: () => (
		<Label htmlFor="input-id" className="text-red-500">
			Label with Custom Class
		</Label>
	),
};

export const WithInput: Story = {
	render: () => (
		<div>
			<Label htmlFor="input-id">Label with Input</Label>
			<Input id="input-id" type="text" />
		</div>
	),
};

export const WithLongText: Story = {
	render: () => (
		<Label htmlFor="input-id">
			This is a label with a very long text to demonstrate how it handles
			overflow and responsiveness in various scenarios.
		</Label>
	),
};
