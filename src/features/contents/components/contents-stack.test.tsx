import { ContentsStack } from "@/features/contents/components/contents-stack";
import type { Contents } from "@/features/contents/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/stack/stack-skeleton", () => ({
	StackSkeleton: () => <div data-testid="stack-skeleton" />,
}));

vi.mock("next-view-transitions", () => ({
	Link: vi.fn(({ children, ...rest }) => <a {...rest}>{children}</a>),
}));

describe("ContentsStack", () => {
	it("renders StatusCodeView if contents is an empty array", () => {
		render(<ContentsStack contents={[]} />);

		const statusCodeView = screen.getByTestId("status-code-view");
		expect(statusCodeView).toBeInTheDocument();
		expect(statusCodeView).toHaveTextContent("204");
	});

	it("renders SmallCard components for each content item", () => {
		const contentsData: Contents[] = [
			{
				id: 1,
				title: "Title 1",
				quote: "Quote 1",
				url: "http://example.com/1",
			},
			{
				id: 2,
				title: "Title 2",
				quote: "Quote 2",
				url: "http://example.com/2",
			},
		];

		render(<ContentsStack contents={contentsData} />);

		for (const item of contentsData) {
			const smallCard = screen.getByTestId(`small-card-${item.id}`);
			expect(smallCard).toBeInTheDocument();
			expect(smallCard).toHaveTextContent(item.title);
			expect(smallCard).toHaveTextContent(item.quote ?? "");
			expect(smallCard).toHaveAttribute("href", item.url);
		}
	});
});
