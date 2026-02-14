import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { BooksForm } from "./books-form";

const meta = {
	component: BooksForm,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof BooksForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		addBooks: fn().mockResolvedValue({
			success: true,
			message: "inserted",
		}),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const isbnInput = canvas.getByLabelText("ISBN");
		await expect(isbnInput).toBeInTheDocument();
		await expect(isbnInput).toHaveAttribute("placeholder", "978-4-XXXX-XXXX-X");
		await expect(isbnInput).toBeRequired();

		const titleInput = canvas.getByLabelText("タイトル");
		await expect(titleInput).toBeInTheDocument();
		await expect(titleInput).toBeRequired();

		await expect(
			canvas.getByRole("button", { name: "保存" }),
		).toBeInTheDocument();
	},
};

export const WithError: Story = {
	args: {
		addBooks: fn().mockRejectedValue(new Error("Failed to add book")),
	},
};

export const FillAndSubmit: Story = {
	args: {
		addBooks: fn().mockResolvedValue({
			success: true,
			message: "inserted",
		}),
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);

		const isbnInput = canvas.getByLabelText("ISBN");
		const titleInput = canvas.getByLabelText("タイトル");

		await userEvent.type(isbnInput, "978-4-1234-5678-9");
		await userEvent.type(titleInput, "テストブック");

		await expect(isbnInput).toHaveValue("978-4-1234-5678-9");
		await expect(titleInput).toHaveValue("テストブック");

		const submitButton = canvas.getByRole("button", { name: "保存" });
		await userEvent.click(submitButton);

		await expect(args.addBooks).toHaveBeenCalled();
	},
};
