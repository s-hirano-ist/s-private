import { NewsStack } from "@/features/news/components/news-stack";
import type { News } from "@/features/news/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/stack/stack-skeleton", () => ({
	StackSkeleton: () => <div data-testid="stack-skeleton" />,
}));

vi.mock("@/components/stack/small-card", () => ({
	SmallCard: ({ id }: { id: string }) => (
		<div data-testid={`small-card-${id}`} />
	),
}));

describe("NewsStack", () => {
	it("renders StackSkeleton if news is undefined", () => {
		render(<NewsStack news={undefined as unknown as News[]} />);

		// StackSkeleton が描画されていることを確認
		expect(screen.getByTestId("stack-skeleton")).toBeInTheDocument();
	});

	it("renders StatusCodeView if news is an empty array", () => {
		render(<NewsStack news={[]} />);

		// StatusCodeView が描画されていることを確認
		const statusCodeView = screen.getByTestId("status-code-view");
		expect(statusCodeView).toBeInTheDocument();
		expect(statusCodeView).toHaveTextContent("204");
	});

	it("renders SmallCard components for each news item", () => {
		const newsData: News[] = [
			{
				id: 1,
				title: "Title 1",
				quote: "Quote 1",
				url: "http://example.com/1",
				category: "Category 1",
			},
			{
				id: 2,
				title: "Title 2",
				quote: "Quote 2",
				url: "http://example.com/2",
				category: "Category 2",
			},
		];

		render(<NewsStack news={newsData} />);

		// newsData の数だけ SmallCard が描画されることを確認
		for (const item of newsData) {
			expect(screen.getByTestId(`small-card-${item.id}`)).toBeInTheDocument();
		}
	});
});
