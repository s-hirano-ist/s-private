import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Loading from "./loading";

// Mock lucide-react
vi.mock("lucide-react", () => ({
	Loader: ({ className, size }: any) => (
		<div data-testid="loader" className={className} data-size={size}>
			Loading...
		</div>
	),
}));

describe("Loading", () => {
	it("should render loading component", () => {
		render(<Loading />);

		expect(screen.getByTestId("loader")).toBeInTheDocument();
	});

	it("should have correct CSS classes", () => {
		render(<Loading />);

		const container = screen.getByTestId("loader").parentElement;
		expect(container).toHaveClass(
			"flex",
			"h-full",
			"items-center",
			"justify-center",
			"p-16",
		);
	});

	it("should render Loader with correct props", () => {
		render(<Loading />);

		const loader = screen.getByTestId("loader");
		expect(loader).toHaveClass("animate-spin", "text-primary");
		expect(loader).toHaveAttribute("data-size", "48");
	});

	it("should display loading text", () => {
		render(<Loading />);

		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});
});
