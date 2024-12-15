import { getUserId } from "@/features/auth/utils/get-session";
import { NewsStackProvider } from "@/features/news/components/news-stack-provider";
import prisma from "@/prisma";
import type { News } from "@prisma/client";
import { render, screen } from "@testing-library/react";
import { type Mock, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/utils/get-session", () => ({
	getUserId: vi.fn(),
}));

vi.mock("@/features/news/components/news-stack", () => ({
	NewsStack: ({ news }: { news: News[] }) => (
		<div data-testid="news-stack">
			{news.map((item) => (
				<div key={item.id} data-testid={`news-item-${item.id}`}>
					{item.title}
				</div>
			))}
		</div>
	),
}));

describe("NewsStackProvider", () => {
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
		(getUserId as Mock).mockResolvedValue(mockUserId);
		(prisma.news.findMany as Mock).mockResolvedValue(mockNewsData);

		// コンポーネントをレンダリング
		render(await NewsStackProvider());

		// NewsStack が描画されていることを確認
		expect(screen.getByTestId("news-stack")).toBeInTheDocument();

		// 各ニュースアイテムが表示されていることを確認
		for (const item of mockNewsData) {
			expect(screen.getByTestId(`news-item-${item.id}`)).toHaveTextContent(
				item.title,
			);
		}
	});

	it("renders StatusCodeView with 500 on error", async () => {
		// モックでエラーをスロー
		(getUserId as Mock).mockRejectedValue(new Error("Test Error"));

		// コンポーネントをレンダリング
		render(await NewsStackProvider());

		// StatusCodeView が描画され、500 エラーコードが表示されていることを確認
		const statusCodeView = screen.getByTestId("status-code-view");
		expect(statusCodeView).toBeInTheDocument();
		expect(statusCodeView).toHaveTextContent("500");
	});
});
