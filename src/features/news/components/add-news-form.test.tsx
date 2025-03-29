import { AddNewsForm } from "@/features/news/components/add-news-form";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

const mockCategories = [
	{ id: 1, name: "A" },
	{ id: 2, name: "B" },
];

describe.skip("AddNewsForm", () => {
	test("renders input fields and buttons correctly", () => {
		render(<AddNewsForm categories={mockCategories} />);

		expect(screen.getByLabelText("タイトル")).toBeInTheDocument();
		expect(screen.getByLabelText("ひとこと")).toBeInTheDocument();
		expect(screen.getByLabelText("URL")).toBeInTheDocument();
		expect(screen.getByText("保存")).toBeInTheDocument();
	});

	test("pastes clipboard news into the URL field", async () => {
		const clipboardText = "https://example.com";
		Object.assign(navigator, {
			clipboard: { readText: vi.fn().mockResolvedValue(clipboardText) },
		});

		render(<AddNewsForm categories={mockCategories} />);
		const pasteButton = screen.getByTestId("paste-button");

		fireEvent.click(pasteButton);

		await waitFor(() => {
			expect(screen.getByLabelText("URL")).toHaveValue(clipboardText);
		});
	});
});
