import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { ContentsForm } from "./contents-form";

type ContentsFormWrapperProps = {
	addContents: (
		formData: FormData,
	) => Promise<{ success: boolean; message: string }>;
};

function ContentsFormWrapper({ addContents }: ContentsFormWrapperProps) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ContentsForm addContents={addContents} />
		</Suspense>
	);
}

const meta = {
	component: ContentsFormWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		addContents: { action: "addContents" },
	},
} satisfies Meta<typeof ContentsFormWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		addContents: async () => ({
			success: true,
			message: "Contents added successfully",
		}),
	},
};

export const ErrorOnSubmit: Story = {
	args: {
		addContents: async () => ({
			success: false,
			message: "Failed to add contents",
		}),
	},
};
