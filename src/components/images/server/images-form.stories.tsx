import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { ImagesForm } from "./images-form";

type ImagesFormWrapperProps = {
	addImage: (
		formData: FormData,
	) => Promise<{ success: boolean; message: string }>;
};

function ImagesFormWrapper({ addImage }: ImagesFormWrapperProps) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ImagesForm addImage={addImage} />
		</Suspense>
	);
}

const meta = {
	component: ImagesFormWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		addImage: { action: "addImage" },
	},
} satisfies Meta<typeof ImagesFormWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		addImage: async () => ({
			success: true,
			message: "Image added successfully",
		}),
	},
};

export const ErrorOnSubmit: Story = {
	args: {
		addImage: async () => ({
			success: false,
			message: "Failed to add image",
		}),
	},
};
