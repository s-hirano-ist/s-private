import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Textarea } from "@/components/ui/textarea";

const meta = {
	title: "Components/UI/Textarea",
	component: Textarea,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <Textarea placeholder="Default textarea" />,
};

export const CustomHeight: Story = {
	render: () => (
		<Textarea className="h-24" placeholder="Textarea with custom height" />
	),
};

export const Disabled: Story = {
	render: () => <Textarea disabled placeholder="Disabled textarea" />,
};

export const WithError: Story = {
	render: () => (
		<Textarea className="border-red-500" placeholder="Textarea with error" />
	),
};

export const FullWidth: Story = {
	render: () => (
		<Textarea className="w-full" placeholder="Full width textarea" />
	),
};

export const WithLabel: Story = {
	render: () => (
		<div>
			<label
				className="mb-2 block text-sm font-medium text-gray-700"
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
		<Textarea placeholder="This is a custom placeholder for the textarea" />
	),
};

export const MultipleTextarea: Story = {
	render: () => (
		<div className="space-y-4">
			<Textarea placeholder="First textarea" />
			<Textarea placeholder="Second textarea" />
			<Textarea placeholder="Third textarea" />
		</div>
	),
};
