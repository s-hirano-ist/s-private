import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ImageForm } from "./image-form";

type ImageFormWrapperProps = {
	addImage: (
		formData: FormData,
	) => Promise<{ success: boolean; message: string }>;
};

function ImageFormWrapper({ addImage }: ImageFormWrapperProps) {
	return <ImageForm addImage={addImage} />;
}

const meta = {
	component: ImageFormWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		addImage: { action: "addImage" },
	},
} satisfies Meta<typeof ImageFormWrapper>;

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
