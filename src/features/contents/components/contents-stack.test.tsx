import { ContentsStack } from "@/features/contents/components/contents-stack";
import type { Contents } from "@/features/contents/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/stack/stack-skeleton", () => ({
	StackSkeleton: () => <div data-testid="stack-skeleton" />,
}));

vi.mock("@/components/status-code-view", () => ({
	StatusCodeView: ({ statusCode }: { statusCode: string }) => (
		<div data-testid="status-code-view">{statusCode}</div>
	),
}));

vi.mock("@/components/stack/small-card", () => ({
	SmallCard: ({ id }: { id: string }) => (
		<div data-testid={`small-card-${id}`}>SmallCard {id}</div>
	),
}));

describe("ContentsStack", () => {
	it("renders StackSkeleton if contents is undefined", () => {
		render(<ContentsStack contents={undefined as unknown as Contents[]} />);

		// StackSkeleton が表示されていることを確認
		expect(screen.getByTestId("stack-skeleton")).toBeInTheDocument();
	});

	it("renders StatusCodeView if contents is an empty array", () => {
		render(<ContentsStack contents={[]} />);

		// StatusCodeView が表示されていることを確認
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

		// SmallCard がデータ数分描画されていることを確認
		for (const item of contentsData) {
			const smallCard = screen.getByTestId(`small-card-${item.id}`);
			expect(smallCard).toBeInTheDocument();
			expect(smallCard).toHaveTextContent(`SmallCard ${item.id}`);
		}
	});
});
