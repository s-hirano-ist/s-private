import { render, screen } from "@testing-library/react";
import { describe, expect, Mock, test, vi } from "vitest";
import { getSelfId } from "@/features/auth/utils/session";
import { ContentsStack } from "@/features/contents/components/contents-stack";
import prisma from "@/prisma";

vi.mock("@/features/auth/utils/session", () => ({
	getSelfId: vi.fn(),
}));

describe.skip("ContentsStack", () => {
	test("renders ContentsStack with contents data", async () => {
		// モックデータ
		const mockUserId = "user123";
		const mockContentsData = [
			{
				id: "1",
				title: "Title 1",
				quote: "Quote 1",
				url: "http://example.com/1",
			},
			{
				id: "2",
				title: "Title 2",
				quote: "Quote 2",
				url: "http://example.com/2",
			},
		];

		// モックの設定
		(getSelfId as Mock).mockResolvedValue(mockUserId);
		(prisma.contents.findMany as Mock).mockResolvedValue(mockContentsData);

		// コンポーネントをレンダリング
		render(await ContentsStack());

		// 各コンテンツアイテムが表示されていることを確認
		for (const item of mockContentsData) {
			const contentItem = screen.getByTestId(`small-card-${item.id}`);
			expect(contentItem).toBeInTheDocument();
			expect(contentItem).toHaveTextContent(item.title);
		}
	});

	test("renders StatusCodeView with 500 on error", async () => {
		// モックでエラーをスロー
		(getSelfId as Mock).mockRejectedValue(new Error("Test Error"));

		// コンポーネントをレンダリング
		render(await ContentsStack());

		// StatusCodeView が描画され、500 エラーコードが表示されていることを確認
		const statusCodeView = screen.getByTestId("status-code-view");
		expect(statusCodeView).toBeInTheDocument();
		expect(statusCodeView).toHaveTextContent("500");
	});
});
