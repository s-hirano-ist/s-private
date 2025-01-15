import { getSelfId } from "@/features/auth/utils/session";
import { NewsStack } from "@/features/news/components/news-stack";
import prisma from "@/prisma";
import { render, screen } from "@testing-library/react";
import { type Mock, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/utils/session", () => ({
	getSelfId: vi.fn(),
}));

describe("NewsStack", () => {
	it("renders NewsStack with news data", async () => {
		// モックデータ
		const mockUserId = "user123";
		const mockNewsData = [
			{
				id: 1,
				title: "Title 1",
				quote: "Quote 1",
				url: "http://example.com/1",
				Category: { name: "Category 1" },
			},
			{
				id: 2,
				title: "Title 2",
				quote: "Quote 2",
				url: "http://example.com/2",
				Category: { name: "Category 2" },
			},
		];

		// モックの設定
		(getSelfId as Mock).mockResolvedValue(mockUserId);
		(prisma.news.findMany as Mock).mockResolvedValue(mockNewsData);

		// コンポーネントをレンダリング
		render(await NewsStack());

		// 各ニュースアイテムが表示されていることを確認
		for (const item of mockNewsData) {
			expect(screen.getByTestId(`small-card-${item.id}`)).toHaveTextContent(
				item.title,
			);
		}
	});

	it("renders StatusCodeView with 500 on error", async () => {
		// モックでエラーをスロー
		(getSelfId as Mock).mockRejectedValue(new Error("Test Error"));

		// コンポーネントをレンダリング
		render(await NewsStack());

		// StatusCodeView が描画され、500 エラーコードが表示されていることを確認
		const statusCodeView = screen.getByTestId("status-code-view");
		expect(statusCodeView).toBeInTheDocument();
		expect(statusCodeView).toHaveTextContent("500");
	});
});
