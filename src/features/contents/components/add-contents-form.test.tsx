import { AddContentsForm } from "@/features/contents/components/add-contents-form";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("AddContentsForm", () => {
	it("renders input fields and buttons correctly", () => {
		render(<AddContentsForm />);

		expect(screen.getByLabelText("タイトル")).toBeInTheDocument();
		expect(screen.getByLabelText("ひとこと")).toBeInTheDocument();
		expect(screen.getByLabelText("URL")).toBeInTheDocument();
		expect(screen.getByText("保存")).toBeInTheDocument();
	});

	it("pastes clipboard content into the URL field", async () => {
		const clipboardText = "https://example.com";
		Object.assign(navigator, {
			clipboard: { readText: vi.fn().mockResolvedValue(clipboardText) },
		});

		render(<AddContentsForm />);
		const pasteButton = screen.getByTestId("paste-button");

		fireEvent.click(pasteButton);

		await waitFor(() => {
			expect(screen.getByLabelText("URL")).toHaveValue(clipboardText);
		});
	});
});
