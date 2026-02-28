import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AxeIcon } from "lucide-react";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
	component: Input,
	parameters: { layout: "centered" },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Input aria-label="Default input" placeholder="Default input" />
	),
};

export const WithCustomClass: Story = {
	render: () => (
		<Input
			aria-label="Input with custom class"
			className="border-red-500"
			placeholder="Input with custom class"
		/>
	),
};

export const Disabled: Story = {
	render: () => (
		<Input aria-label="Disabled input" disabled placeholder="Disabled input" />
	),
};

export const WithTypePassword: Story = {
	render: () => (
		<Input
			aria-label="Password input"
			placeholder="Password input"
			type="password"
		/>
	),
};

export const WithError: Story = {
	render: () => (
		<Input
			aria-label="Input with error"
			className="border-red-500"
			placeholder="Input with error"
		/>
	),
};

export const FullWidth: Story = {
	render: () => (
		<Input
			aria-label="Full width input"
			className="w-full"
			placeholder="Full width input"
		/>
	),
};

export const WithLongPlaceholder: Story = {
	render: () => (
		<Input
			aria-label="Long placeholder input"
			placeholder="This is an input with a very long placeholder to see how it handles overflow and responsiveness"
		/>
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
			<Input aria-label="Input with icon" placeholder="Input with icon" />
		</div>
	),
};

export const WithHelperText: Story = {
	render: () => (
		<div>
			<Input
				aria-label="Input with helper text"
				placeholder="Input with helper text"
			/>
			<p className="mt-2 text-gray-500 text-sm">
				This is some helper text to assist the user.
			</p>
		</div>
	),
};
