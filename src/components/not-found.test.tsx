import { NotFound } from "@/components/not-found";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("NotFound component", () => {
	it("renders the status code 404", () => {
		render(<NotFound />);

		// "404" が表示されていることを確認
		const statusCode = screen.getByText("404");
		expect(statusCode).toBeInTheDocument();
	});

	it("renders the not found message", () => {
		render(<NotFound />);

		// メッセージが正しく表示されていることを確認
		const message = screen.getByText(
			"お探しのコンテンツが見つかりませんでした。",
		);
		expect(message).toBeInTheDocument();
	});

	it("renders the HOME link", () => {
		render(<NotFound />);

		// HOMEへ戻るボタンがリンクとして表示されていることを確認
		const homeLink = screen.getByRole("link", { name: "HOMEへ戻る" });
		expect(homeLink).toBeInTheDocument();
		expect(homeLink).toHaveAttribute("href", "/auth");
	});
});
