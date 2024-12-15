import { getUserId } from "@/features/auth/utils/get-session";
import { ContentsStackProvider } from "@/features/contents/components/contents-stack-provider";
import prisma from "@/prisma";
import type { Contents } from "@prisma/client";
import { render, screen } from "@testing-library/react";
import { type Mock, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => {
	return {};
});

vi.mock("@/features/auth/utils/get-session", () => ({
	getUserId: vi.fn(),
}));

vi.mock("@/prisma", () => ({
	default: { contents: { findMany: vi.fn() } },
}));

vi.mock("@/pino", () => ({
	loggerError: vi.fn(),
}));

vi.mock("@/features/contents/components/contents-stack", () => ({
	ContentsStack: ({ contents }: { contents: Contents[] }) => (
		<div data-testid="contents-stack">
			{contents.map((item) => (
				<div key={item.id} data-testid={`content-item-${item.id}`}>
					{item.title}
				</div>
			))}
		</div>
	),
}));

vi.mock("@/components/status-code-view", () => ({
	StatusCodeView: ({ statusCode }: { statusCode: string }) => (
		<div data-testid="status-code-view">{statusCode}</div>
	),
}));

describe("ContentsStackProvider", () => {
	it("renders ContentsStack with contents data", async () => {
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
		(getUserId as Mock).mockResolvedValue(mockUserId);
		(prisma.contents.findMany as Mock).mockResolvedValue(mockContentsData);

		// コンポーネントをレンダリング
		render(await ContentsStackProvider());

		// ContentsStack が描画されていることを確認
		expect(screen.getByTestId("contents-stack")).toBeInTheDocument();

		// 各コンテンツアイテムが表示されていることを確認
		for (const item of mockContentsData) {
			const contentItem = screen.getByTestId(`content-item-${item.id}`);
			expect(contentItem).toBeInTheDocument();
			expect(contentItem).toHaveTextContent(item.title);
		}
	});

	it("renders StatusCodeView with 500 on error", async () => {
		// モックでエラーをスロー
		(getUserId as Mock).mockRejectedValue(new Error("Test Error"));

		// コンポーネントをレンダリング
		render(await ContentsStackProvider());

		// StatusCodeView が描画され、500 エラーコードが表示されていることを確認
		const statusCodeView = screen.getByTestId("status-code-view");
		expect(statusCodeView).toBeInTheDocument();
		expect(statusCodeView).toHaveTextContent("500");
	});
});
