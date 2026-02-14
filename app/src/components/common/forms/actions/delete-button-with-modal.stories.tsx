import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { DeleteButtonWithModal } from "./delete-button-with-modal";

const meta = {
	component: DeleteButtonWithModal,
	parameters: { layout: "centered", a11y: { test: "todo" } },
} satisfies Meta<typeof DeleteButtonWithModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: "1",
		title: "Sample Article Title",
		deleteAction: fn(),
	},
};

export const LongTitle: Story = {
	args: {
		id: "2",
		title:
			"This is a very long article title that might wrap to multiple lines to test how the component handles longer text content in the dialog",
		deleteAction: fn(),
	},
};

export const ShortTitle: Story = {
	args: {
		id: "3",
		title: "Short",
		deleteAction: fn(),
	},
};

export const OpenAndCloseDialog: Story = {
	args: {
		id: "1",
		title: "Test Item",
		deleteAction: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);

		const deleteButton = canvas.getByRole("button");
		await userEvent.click(deleteButton);

		await expect(body.getByText("削除の確認")).toBeInTheDocument();
		await expect(body.getByText("Test Item")).toBeInTheDocument();
		await expect(
			body.getByRole("button", { name: "キャンセル" }),
		).toBeInTheDocument();
		await expect(
			body.getByRole("button", { name: "削除" }),
		).toBeInTheDocument();

		const cancelButton = body.getByRole("button", { name: "キャンセル" });
		await userEvent.click(cancelButton);

		await expect(body.queryByText("削除の確認")).not.toBeInTheDocument();
	},
};

export const DeleteSuccess: Story = {
	args: {
		id: "1",
		title: "Test Item",
		deleteAction: fn().mockImplementation(async () => ({
			success: true,
			message: "deleted",
		})),
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);

		const deleteButton = canvas.getByRole("button");
		await userEvent.click(deleteButton);

		const confirmButton = body.getByRole("button", { name: "削除" });
		await userEvent.click(confirmButton);

		await waitFor(() => expect(args.deleteAction).toHaveBeenCalledWith("1"));
	},
};

export const DeleteError: Story = {
	args: {
		id: "1",
		title: "Test Item",
		deleteAction: fn().mockRejectedValue(new Error("Delete failed")),
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);

		const deleteButton = canvas.getByRole("button");
		await userEvent.click(deleteButton);

		const confirmButton = body.getByRole("button", { name: "削除" });
		await userEvent.click(confirmButton);

		await expect(args.deleteAction).toHaveBeenCalledWith("1");
		await expect(body.getByText("削除の確認")).toBeInTheDocument();
	},
};
