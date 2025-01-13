import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AddFormSkeleton } from "./add-form-skeleton";

describe("AddFormSkeleton", () => {
	it("renders correctly when showCategory is true", () => {
		render(<AddFormSkeleton showCategory={true} />);

		// カテゴリーラベルとスケルトンが表示されることを確認
		expect(screen.queryByText("カテゴリー")).toBeInTheDocument();
		expect(screen.getAllByRole("presentation")).toHaveLength(4);
	});

	it("renders correctly when showCategory is false", () => {
		render(<AddFormSkeleton showCategory={false} />);

		// カテゴリーラベルが表示されないことを確認
		expect(screen.queryByText("カテゴリー")).not.toBeInTheDocument();
		expect(screen.getAllByRole("presentation")).toHaveLength(3);
	});

	it("renders texts and skeletons for title, quote, and URL", () => {
		render(<AddFormSkeleton showCategory={false} />);

		// 各ラベルが正しく表示されることを確認
		expect(screen.getByText("タイトル")).toBeInTheDocument();
		expect(screen.getByText("ひとこと")).toBeInTheDocument();
		expect(screen.getByText("URL")).toBeInTheDocument();

		// Skeleton 要素が存在することを確認
		expect(screen.getAllByRole("presentation")).toHaveLength(3);
	});
});
