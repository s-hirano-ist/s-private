import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { NoteForm } from "./note-form";

const meta = {
	component: NoteForm,
	parameters: { layout: "centered" },
} satisfies Meta<typeof NoteForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { addNote: fn() } };

export const FillAndSubmit: Story = {
	args: {
		addNote: fn().mockResolvedValue({
			success: true,
			message: "inserted",
		}),
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);

		const titleInput = canvas.getByLabelText("タイトル");
		await userEvent.type(titleInput, "テストノート");
		await expect(titleInput).toHaveValue("テストノート");

		const markdownInput = canvas.getByLabelText("詳細");
		await userEvent.type(markdownInput, "# テストマークダウン");
		await expect(markdownInput).toHaveValue("# テストマークダウン");

		const submitButton = canvas.getByRole("button", { name: "保存" });
		await userEvent.click(submitButton);

		await expect(args.addNote).toHaveBeenCalled();
	},
};
