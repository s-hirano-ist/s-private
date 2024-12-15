import { ERROR_MESSAGES } from "@/constants";
import { getUserId } from "@/features/auth/utils/get-session";
import { generateUrlWithMetadata } from "@/features/image/actions/generate-url-with-metadata";
import { ImageStackProvider } from "@/features/image/components/image-stack-provider";
import prisma from "@/prisma";
import { render, screen } from "@testing-library/react";
import { type Mock, describe, expect, it, vi } from "vitest";

// 各依存関数をモック化
vi.mock("@/features/auth/utils/get-session", () => ({
	getUserId: vi.fn(),
}));

vi.mock("@/features/image/actions/generate-url-with-metadata", () => ({
	generateUrlWithMetadata: vi.fn(),
}));

vi.mock("@/prisma", () => ({
	default: { images: { findMany: vi.fn() } },
}));

describe("ImageStackProvider", () => {
	it("renders the ImageStack with images", async () => {
		// モックの準備
		(getUserId as Mock).mockResolvedValue("user123");
		(prisma.images.findMany as Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);
		(generateUrlWithMetadata as Mock)
			.mockResolvedValueOnce({
				success: true,
				data: { url: "/image1.png", metadata: { width: 800, height: 600 } },
			})
			.mockResolvedValueOnce({
				success: true,
				data: { url: "/image2.png", metadata: { width: 1024, height: 768 } },
			});

		// コンポーネントをレンダリング
		render(await ImageStackProvider());

		// ImageStack コンポーネントが正しく描画されていることを確認
		const images = screen.getAllByAltText("");
		expect(images).toHaveLength(2);
		expect.stringContaining(encodeURIComponent("/image1.png"));
		expect.stringContaining(encodeURIComponent("/image2.png"));
	});

	it("renders 'not-found.png' for failed URL generation", async () => {
		(getUserId as Mock).mockResolvedValue("user123");
		(prisma.images.findMany as Mock).mockResolvedValue([{ id: 1 }]);
		(generateUrlWithMetadata as Mock).mockResolvedValueOnce({
			success: false,
		});

		render(await ImageStackProvider());

		// "not-found.png" が表示されることを確認
		const images = screen.getAllByAltText("");
		expect(images).toHaveLength(1);
		expect.stringContaining(encodeURIComponent("/not-found.png"));
	});

	it("renders StatusCodeView with 500 on error", async () => {
		// 例外をスローするモック
		(getUserId as Mock).mockRejectedValue(new Error("Test Error"));

		render(await ImageStackProvider());

		// 500 ステータスコードが表示されることを確認
		const statusCode = screen.getByText("500");
		expect(statusCode).toBeInTheDocument();
	});
});
