import { render, screen } from "@testing-library/react";
import { describe, expect, Mock, test, vi } from "vitest";
import { getSelfId } from "@/features/auth/utils/session";
import { ImageStack } from "@/features/image/components/image-stack";
import prisma from "@/prisma";

// 各依存関数をモック化
vi.mock("@/features/auth/utils/session", () => ({
	getSelfId: vi.fn(),
}));

vi.mock("@/features/image/actions/generate-url", () => ({
	generateUrl: vi.fn(),
}));

describe.skip("ImageStack", () => {
	test("renders the ImageStack with images", async () => {
		// モックの準備
		(getSelfId as Mock).mockResolvedValue("user123");
		(prisma.images.findMany as Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);

		// コンポーネントをレンダリング
		render(await ImageStack());

		// ImageStack コンポーネントが正しく描画されていることを確認
		const images = screen.getAllByAltText("");
		expect(images).toHaveLength(2);
		expect.stringContaining(encodeURIComponent("/image1.png"));
		expect.stringContaining(encodeURIComponent("/image2.png"));
	});

	test("renders 'not-found.png' for failed URL generation", async () => {
		(getSelfId as Mock).mockResolvedValue("user123");
		(prisma.images.findMany as Mock).mockResolvedValue([{ id: 1 }]);

		render(await ImageStack());

		// "not-found.png" が表示されることを確認
		const images = screen.getAllByAltText("");
		expect(images).toHaveLength(1);
		expect.stringContaining(encodeURIComponent("/not-found.png"));
	});

	test("renders StatusCodeView with 500 on error", async () => {
		// 例外をスローするモック
		(getSelfId as Mock).mockRejectedValue(new Error("Test Error"));

		render(await ImageStack());

		// 500 ステータスコードが表示されることを確認
		const statusCode = screen.getByText("500");
		expect(statusCode).toBeInTheDocument();
	});
});
