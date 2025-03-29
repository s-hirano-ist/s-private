import { getSelfId } from "@/features/auth/utils/session";
import { generateUrl } from "@/features/image/actions/generate-url";
import { AllImageStack } from "@/features/image/components/all-image-stack";
import prisma from "@/prisma";
import { render, screen } from "@testing-library/react";
import { Mock, describe, expect, test, vi } from "vitest";

// 各依存関数をモック化
vi.mock("@/features/auth/utils/session", () => ({
	getSelfId: vi.fn(),
}));

vi.mock("@/features/image/actions/generate-url", () => ({
	generateUrl: vi.fn(),
}));

describe.skip("AllImageStack", () => {
	test("renders the ImageStack with images", async () => {
		// モックの準備
		(getSelfId as Mock).mockResolvedValue("user123");
		(prisma.staticImages.findMany as Mock).mockResolvedValue([
			{ id: 1 },
			{ id: 2 },
		]);
		(generateUrl as Mock)
			.mockResolvedValueOnce({
				success: true,
				data: {
					thumbnailSrc: "/image1.png",
					originalSrc: "/image1.png",
				},
			})
			.mockResolvedValueOnce({
				success: true,
				data: {
					thumbnailSrc: "/image2.png",
					originalSrc: "/image2.png",
				},
			});

		// コンポーネントをレンダリング
		render(await AllImageStack({ page: 1 }));

		// ImageStack コンポーネントが正しく描画されていることを確認
		const images = screen.getAllByAltText("");
		expect(images).toHaveLength(2);
		expect.stringContaining(encodeURIComponent("/image1.png"));
		expect.stringContaining(encodeURIComponent("/image2.png"));
	});

	test("renders 'not-found.png' for failed URL generation", async () => {
		(getSelfId as Mock).mockResolvedValue("user123");
		(prisma.staticImages.findMany as Mock).mockResolvedValue([{ id: 1 }]);
		(generateUrl as Mock).mockResolvedValueOnce({
			success: false,
		});

		render(await AllImageStack({ page: 1 }));

		// "not-found.png" が表示されることを確認
		const images = screen.getAllByAltText("");
		expect(images).toHaveLength(1);
		expect.stringContaining(encodeURIComponent("/not-found.png"));
	});

	test("renders StatusCodeView with 500 on error", async () => {
		// 例外をスローするモック
		(getSelfId as Mock).mockRejectedValue(new Error("Test Error"));

		render(await AllImageStack({ page: 1 }));

		// 500 ステータスコードが表示されることを確認
		const statusCode = screen.getByText("500");
		expect(statusCode).toBeInTheDocument();
	});
});
