import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Textarea } from "./textarea";

const meta = {
	component: Textarea,
	parameters: { layout: "centered" },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Textarea aria-label="Default textarea" placeholder="Default textarea" />
	),
};

export const CustomHeight: Story = {
	render: () => (
		<Textarea
			aria-label="Textarea with custom height"
			className="h-24"
			placeholder="Textarea with custom height"
		/>
	),
};

export const Disabled: Story = {
	render: () => (
		<Textarea
			aria-label="Disabled textarea"
			disabled
			placeholder="Disabled textarea"
		/>
	),
};

export const WithError: Story = {
	render: () => (
		<Textarea
			aria-label="Textarea with error"
			className="border-red-500"
			placeholder="Textarea with error"
		/>
	),
};

export const FullWidth: Story = {
	render: () => (
		<Textarea
			aria-label="Full width textarea"
			className="w-full"
			placeholder="Full width textarea"
		/>
	),
};

export const WithLabel: Story = {
	render: () => (
		<div>
			<label
				className="mb-2 block font-medium text-gray-700 text-sm"
				htmlFor="textarea-with-label"
			>
				Label for Textarea
			</label>
			<Textarea id="textarea-with-label" placeholder="Textarea with label" />
		</div>
	),
};

export const WithCustomPlaceholder: Story = {
	render: () => (
		<Textarea
			aria-label="Custom placeholder textarea"
			placeholder="This is a custom placeholder for the textarea"
		/>
	),
};

export const MultipleTextarea: Story = {
	render: () => (
		<div className="space-y-4">
			<Textarea aria-label="First textarea" placeholder="First textarea" />
			<Textarea aria-label="Second textarea" placeholder="Second textarea" />
			<Textarea aria-label="Third textarea" placeholder="Third textarea" />
		</div>
	),
};
