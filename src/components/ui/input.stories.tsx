import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AxeIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "./label";

const meta = {
	title: "Components/UI/Input",
	component: Input,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <Input placeholder="Default input" />,
};

export const WithCustomClass: Story = {
	render: () => (
		<Input className="border-red-500" placeholder="Input with custom class" />
	),
};

export const Disabled: Story = {
	render: () => <Input disabled placeholder="Disabled input" />,
};

export const WithTypePassword: Story = {
	render: () => <Input placeholder="Password input" type="password" />,
};

export const WithError: Story = {
	render: () => (
		<Input className="border-red-500" placeholder="Input with error" />
	),
};

export const FullWidth: Story = {
	render: () => <Input className="w-full" placeholder="Full width input" />,
};

export const WithLongPlaceholder: Story = {
	render: () => (
		<Input placeholder="This is an input with a very long placeholder to see how it handles overflow and responsiveness" />
	),
};

export const WithLabel: Story = {
	render: () => (
		<div>
			<Label htmlFor="input-with-label">Label for Input</Label>
			<Input id="input-with-label" placeholder="Input with label" />
		</div>
	),
};

export const WithIcon: Story = {
	render: () => (
		<div className="flex items-center space-x-2">
			<AxeIcon />
			<Input placeholder="Input with icon" />
		</div>
	),
};

export const WithHelperText: Story = {
	render: () => (
		<div>
			<Input placeholder="Input with helper text" />
			<p className="mt-2 text-sm text-gray-500">
				This is some helper text to assist the user.
			</p>
		</div>
	),
};
