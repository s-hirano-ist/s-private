import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StackSkeleton } from "./stack-skeleton";

describe("StackSkeleton", () => {
	it("renders the correct number of SmallCardSkeleton components", () => {
		render(<StackSkeleton />);

		const skeletons = screen.getAllByTestId("small-card-skeleton");
		expect(skeletons).toHaveLength(10);
	});

	it("applies the correct grid classes", () => {
		const { container } = render(<StackSkeleton />);

		const gridContainer = container.firstChild;
		expect(gridContainer).toHaveClass(
			"grid",
			"grid-cols-1",
			"gap-2",
			"p-4",
			"sm:grid-cols-2",
			"sm:gap-4",
		);
	});
});
