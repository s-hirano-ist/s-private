import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";
import { DeleteButtonWithModal } from "./delete-button-with-modal";

vi.mock("next-intl", () => ({
	useTranslations: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: Object.assign(vi.fn(), {
		error: vi.fn(),
	}),
}));

describe("DeleteButtonWithModal", () => {
	const mockDeleteAction = vi.fn();
	const mockLabel = vi.fn();
	const mockMessage = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		(useTranslations as Mock).mockImplementation((namespace) => {
			if (namespace === "label") return mockLabel;
			if (namespace === "message") return mockMessage;
			return vi.fn();
		});

		mockLabel.mockImplementation((key) => {
			switch (key) {
				case "confirmDelete":
					return "Confirm Delete";
				case "cancel":
					return "Cancel";
				case "delete":
					return "Delete";
				default:
					return key;
			}
		});

		mockMessage.mockImplementation((key) => {
			switch (key) {
				case "error":
					return "An error occurred";
				default:
					return key;
			}
		});
	});

	test("should render delete button with trash icon", () => {
		render(
			<DeleteButtonWithModal
				deleteAction={mockDeleteAction}
				id="1"
				title="Test Item"
			/>,
		);

		const deleteButton = screen.getByRole("button");
		expect(deleteButton).toBeInTheDocument();
		expect(deleteButton).toHaveClass(
			"absolute",
			"right-2",
			"top-2",
			"text-destructive",
			"hover:bg-destructive/10",
		);

		const trashIcon = deleteButton.querySelector("svg");
		expect(trashIcon).toBeInTheDocument();
		expect(trashIcon).toHaveClass("size-4");
	});

	test("should open dialog when delete button is clicked", () => {
		render(
			<DeleteButtonWithModal
				deleteAction={mockDeleteAction}
				id="1"
				title="Test Item"
			/>,
		);

		const deleteButton = screen.getByRole("button");
		fireEvent.click(deleteButton);

		expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
		expect(screen.getByText("Test Item")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
	});

	test("should close dialog when cancel button is clicked", () => {
		render(
			<DeleteButtonWithModal
				deleteAction={mockDeleteAction}
				id="1"
				title="Test Item"
			/>,
		);

		const deleteButton = screen.getByRole("button");
		fireEvent.click(deleteButton);

		const cancelButton = screen.getByRole("button", { name: "Cancel" });
		fireEvent.click(cancelButton);

		expect(screen.queryByText("Confirm Delete")).not.toBeInTheDocument();
	});

	test("should call deleteAction and show success toast when delete is confirmed", async () => {
		mockDeleteAction.mockResolvedValue({
			success: true,
			message: "deleteSuccess",
			data: 1,
		});

		render(
			<DeleteButtonWithModal
				deleteAction={mockDeleteAction}
				id="1"
				title="Test Item"
			/>,
		);

		const deleteButton = screen.getByRole("button");
		fireEvent.click(deleteButton);

		const confirmDeleteButton = screen.getByRole("button", { name: "Delete" });
		fireEvent.click(confirmDeleteButton);

		await waitFor(() => {
			expect(mockDeleteAction).toHaveBeenCalledWith("1");
			expect(toast).toHaveBeenCalledWith("deleteSuccess");
			expect(screen.queryByText("Confirm Delete")).not.toBeInTheDocument();
		});
	});

	test("should show error toast when deleteAction fails", async () => {
		mockDeleteAction.mockRejectedValue(new Error("Delete failed"));

		render(
			<DeleteButtonWithModal
				deleteAction={mockDeleteAction}
				id="1"
				title="Test Item"
			/>,
		);

		const deleteButton = screen.getByRole("button");
		fireEvent.click(deleteButton);

		const confirmDeleteButton = screen.getByRole("button", { name: "Delete" });
		fireEvent.click(confirmDeleteButton);

		await waitFor(() => {
			expect(mockDeleteAction).toHaveBeenCalledWith("1");
			expect(toast.error).toHaveBeenCalledWith("An error occurred");
			expect(screen.getByText("Confirm Delete")).toBeInTheDocument(); // Dialog remains open
		});
	});

	test("should disable buttons while deleting", async () => {
		mockDeleteAction.mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(
						() => resolve({ success: true, message: "success", data: 1 }),
						100,
					),
				),
		);

		render(
			<DeleteButtonWithModal
				deleteAction={mockDeleteAction}
				id="1"
				title="Test Item"
			/>,
		);

		const deleteButton = screen.getByRole("button");
		fireEvent.click(deleteButton);

		const confirmDeleteButton = screen.getByRole("button", { name: "Delete" });
		const cancelButton = screen.getByRole("button", { name: "Cancel" });

		fireEvent.click(confirmDeleteButton);

		expect(confirmDeleteButton).toBeDisabled();
		expect(cancelButton).toBeDisabled();

		await waitFor(() => {
			expect(toast).toHaveBeenCalled();
		});
	});

	test("should prevent dialog from closing during deletion", async () => {
		mockDeleteAction.mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(
						() => resolve({ success: true, message: "success", data: 1 }),
						100,
					),
				),
		);

		render(
			<DeleteButtonWithModal
				deleteAction={mockDeleteAction}
				id="1"
				title="Test Item"
			/>,
		);

		const deleteButton = screen.getByRole("button");
		fireEvent.click(deleteButton);

		const confirmDeleteButton = screen.getByRole("button", { name: "Delete" });
		fireEvent.click(confirmDeleteButton);

		// Try to close dialog while deleting
		const dialog = screen.getByRole("dialog");
		fireEvent.keyDown(dialog, { key: "Escape" });

		// Dialog should still be open
		expect(screen.getByText("Confirm Delete")).toBeInTheDocument();

		await waitFor(() => {
			expect(toast).toHaveBeenCalled();
		});
	});

	test("should stop event propagation when delete button is clicked", () => {
		const mockParentClick = vi.fn();

		render(
			// biome-ignore lint: vitest
			<div onClick={mockParentClick}>
				<DeleteButtonWithModal
					deleteAction={mockDeleteAction}
					id="1"
					title="Test Item"
				/>
			</div>,
		);

		const deleteButton = screen.getByRole("button");
		fireEvent.click(deleteButton);

		expect(mockParentClick).not.toHaveBeenCalled();
		expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
	});
});
