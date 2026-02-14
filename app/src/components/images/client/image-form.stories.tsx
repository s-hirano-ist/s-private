import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within } from "storybook/test";
import { ImageForm } from "./image-form";

const meta = {
	component: ImageForm,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ImageForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { addImage: fn() },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await expect(canvas.getByText("画像")).toBeInTheDocument();
		await expect(
			canvas.getByRole("button", { name: "アップロード" }),
		).toBeInTheDocument();

		const fileInput = canvas.getByLabelText("画像");
		await expect(fileInput).toBeRequired();
	},
};
