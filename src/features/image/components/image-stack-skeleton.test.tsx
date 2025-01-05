import { SKELETON_STACK_SIZE } from "@/constants";
import { ImageStackSkeleton } from "@/features/image/components/image-stack-skeleton";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("ImageStackSkeleton", () => {
	it("renders the correct number of skeletons", () => {
		render(<ImageStackSkeleton />);

		// スケルトン要素の数を検証
		const skeletons = screen.getAllByRole("presentation");
		expect(skeletons).toHaveLength(10); // モックした SKELETON_STACK_SIZE に基づく
	});

	it("applies the correct class to each skeleton", () => {
		render(<ImageStackSkeleton />);

		// 各スケルトン要素が期待するクラスを持つことを確認
		const skeletons = screen.getAllByRole("presentation");
		for (const skeleton of skeletons) {
			expect(skeleton).toHaveClass("h-32 w-full");
		}
	});
});
