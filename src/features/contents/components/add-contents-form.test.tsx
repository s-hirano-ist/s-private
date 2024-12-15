import { addContents } from "@/features/contents/actions/add-contents";
import { AddContentsForm } from "@/features/contents/components/add-contents-form";
import { useToast } from "@/hooks/use-toast";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useFormStatus } from "react-dom";
import { type Mock, describe, expect, it, vi } from "vitest";

vi.mock("@/features/contents/actions/add-contents", () => ({
	addContents: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: vi.fn(),
	}),
}));

vi.mock("react-dom", () => ({
	useFormStatus: vi.fn(),
}));

describe.skip("AddContentsForm", () => {
	it("renders input fields and buttons correctly", () => {
		(useFormStatus as Mock).mockReturnValue({ pending: false });

		render(<AddContentsForm />);

		// 各フィールドとボタンが表示されることを確認
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

	// FIXME: form action vitest https://github.com/vercel/next.js/issues/54757
	// it("calls addContents on form submit and shows success toast", async () => {
	// 	const mockAddContents = addContents as Mock;
	// 	mockAddContents.mockResolvedValueOnce({
	// 		success: true,
	// 		message: "Content added successfully",
	// 	});

	// 	const mockToast = useToast().toast as Mock;

	// 	render(<AddContentsForm />);

	// 	// フォームのフィールドに値を入力
	// 	fireEvent.input(screen.getByLabelText("タイトル"), {
	// 		target: { value: "Test Title" },
	// 	});
	// 	fireEvent.input(screen.getByLabelText("ひとこと"), {
	// 		target: { value: "Test Quote" },
	// 	});
	// 	fireEvent.input(screen.getByLabelText("URL"), {
	// 		target: { value: "https://example.com" },
	// 	});

	// 	// フォーム送信
	// 	fireEvent.submit(screen.getByTestId("add-contents-form"));

	// 	// addContents が呼び出されることを確認
	// 	await waitFor(() => {
	// 		expect(mockAddContents).toHaveBeenCalledWith(
	// 			expect.objectContaining({
	// 				title: "Test Title",
	// 				quote: "Test Quote",
	// 				url: "https://example.com",
	// 			}),
	// 		);
	// 	});

	// 	// 成功トーストが表示されることを確認
	// 	await waitFor(() => {
	// 		expect(mockToast).toHaveBeenCalledWith({
	// 			variant: "default",
	// 			description: "Content added successfully",
	// 		});
	// 	});
	// });

	// it("shows error toast on addContents failure", async () => {
	// 	const mockAddContents = addContents as Mock;
	// 	mockAddContents.mockResolvedValueOnce({
	// 		success: false,
	// 		message: "Failed to add content",
	// 	});

	// 	const mockToast = useToast().toast as Mock;

	// 	render(<AddContentsForm />);

	// 	// フォーム送信
	// 	fireEvent.submit(screen.getByRole("form"));

	// 	// エラートーストが表示されることを確認
	// 	await waitFor(() => {
	// 		expect(mockToast).toHaveBeenCalledWith({
	// 			variant: "destructive",
	// 			description: "Failed to add content",
	// 		});
	// 	});
	// });
});
