import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { BooksForm } from "./books-form";

const meta = {
	component: BooksForm,
	parameters: { layout: "centered" },
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
		await expect(isbnInput).toHaveAttribute("placeholder", "9784774189673");
		await expect(isbnInput).toBeRequired();

		const titleInput = canvas.getByLabelText("タイトル");
		await expect(titleInput).toBeInTheDocument();
		await expect(titleInput).toBeRequired();

		const ratingInput = canvas.getByLabelText("評価 (1-5)");
		await expect(ratingInput).toBeInTheDocument();
		await expect(ratingInput).toBeRequired();
		await expect(ratingInput).toHaveAttribute("type", "number");

		const tagsInput = canvas.getByLabelText("タグ（カンマ区切り）");
		await expect(tagsInput).toBeInTheDocument();

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
		const ratingInput = canvas.getByLabelText("評価 (1-5)");
		const tagsInput = canvas.getByLabelText("タグ（カンマ区切り）");
		const imageInput = canvas.getByLabelText(/書籍画像/);

		await userEvent.type(isbnInput, "978-4-1234-5678-9");
		await userEvent.type(titleInput, "テストブック");
		await userEvent.type(ratingInput, "4");
		await userEvent.type(tagsInput, "技術, 設計");
		await userEvent.upload(
			imageInput,
			new File(["dummy"], "cover.png", { type: "image/png" }),
		);

		await expect(isbnInput).toHaveValue("978-4-1234-5678-9");
		await expect(titleInput).toHaveValue("テストブック");
		await expect(ratingInput).toHaveValue(4);
		await expect(tagsInput).toHaveValue("技術, 設計");

		const submitButton = canvas.getByRole("button", { name: "保存" });
		await userEvent.click(submitButton);

		await expect(args.addBooks).toHaveBeenCalled();
	},
};
