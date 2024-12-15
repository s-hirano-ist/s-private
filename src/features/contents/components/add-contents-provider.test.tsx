import { ERROR_MESSAGES } from "@/constants";
import { AddContentsProvider } from "@/features/contents/components/add-contents-provider";
import { loggerError } from "@/pino";
import { render, screen } from "@testing-library/react";
import { type Mock, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => {
	return {};
});

vi.mock("@/pino", () => ({
	loggerError: vi.fn(),
}));

vi.mock("@/features/contents/components/add-contents-form", () => ({
	AddContentsForm: () => (
		<div data-testid="add-contents-form">Form Component</div>
	),
}));

describe.skip("AddContentsProvider", () => {
	it("renders AddContentsForm successfully", async () => {
		render(await AddContentsProvider());

		// AddContentsForm が描画されていることを確認
		expect(screen.getByTestId("add-contents-form")).toBeInTheDocument();
		expect(screen.getByTestId("add-contents-form")).toHaveTextContent(
			"Form Component",
		);
	});

	it("handles errors by logging and returning an empty fragment", async () => {
		vi.mock("@/features/contents/components/add-contents-provider", () => ({
			AddContentsProvider: vi.fn(async () => {
				throw new Error("Test Error");
			}),
		}));

		render(await AddContentsProvider());

		// 空の要素がレンダリングされていることを確認
		expect(screen.queryByTestId("add-contents-form")).not.toBeInTheDocument();

		// loggerError が呼び出されることを確認
		expect(loggerError).toHaveBeenCalledWith(
			ERROR_MESSAGES.UNEXPECTED,
			{
				caller: "AddContentsProvider",
				status: 500,
			},
			expect.any(Error), // エラーオブジェクト
		);
	});
});
