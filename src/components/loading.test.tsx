import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import Loading from "./loading";

// Mock lucide-react
vi.mock("lucide-react", () => ({
	// eslint-disable-next-line
	Loader: ({ className, size }: any) => (
		<div className={className} data-size={size} data-testid="loader">
			Loading...
		</div>
	),
}));

describe("Loading", () => {
	test("should render loading component", () => {
		render(<Loading />);

		expect(screen.getByTestId("loader")).toBeInTheDocument();
	});

	test("should have correct CSS classes", () => {
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

	test("should render Loader with correct props", () => {
		render(<Loading />);

		const loader = screen.getByTestId("loader");
		expect(loader).toHaveClass("animate-spin", "text-primary");
		expect(loader).toHaveAttribute("data-size", "48");
	});

	test("should display loading text", () => {
		render(<Loading />);

		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});
});
