import { NewsStack } from "@/features/news/components/news-stack";
import type { News } from "@/features/news/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("NewsStack", () => {
	it("renders StatusCodeView if news is an empty array", () => {
		render(<NewsStack news={[]} />);

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

		for (const item of newsData) {
			const smallCard = screen.getByTestId(`small-card-${item.id}`);
			expect(smallCard).toBeInTheDocument();
			expect(smallCard).toHaveTextContent(item.title);
			expect(smallCard).toHaveTextContent(item.quote ?? "");
			expect(smallCard).toHaveAttribute("href", item.url);
		}
	});
});
