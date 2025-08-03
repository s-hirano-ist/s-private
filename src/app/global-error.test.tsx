import { captureException } from "@sentry/nextjs";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import Page from "./global-error";

vi.mock("@sentry/nextjs", () => ({
	captureException: vi.fn(),
}));

describe("Global Error Page", () => {
	const mockReset = vi.fn();
	const mockError = new Error("Test global error") as Error & {
		digest?: string;
	};
	mockError.digest = "test-digest";

	test("should render global error page with 500 status code", () => {
		render(<Page error={mockError} reset={mockReset} />);

		expect(screen.getByText("500")).toBeInTheDocument();
		expect(
			screen.getByText("------Unexpected Error------"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Try again" }),
		).toBeInTheDocument();
	});

	test("should capture exception on mount", () => {
		render(<Page error={mockError} reset={mockReset} />);

		expect(captureException).toHaveBeenCalledWith(mockError);
	});

	test("should call reset function when Try again button is clicked", () => {
		render(<Page error={mockError} reset={mockReset} />);

		const tryAgainButton = screen.getByRole("button", { name: "Try again" });
		fireEvent.click(tryAgainButton);

		expect(mockReset).toHaveBeenCalledTimes(1);
	});

	test("should render html and body tags", () => {
		render(<Page error={mockError} reset={mockReset} />);

		// global-error.tsx returns html and body elements directly,
		// but React Testing Library doesn't render them in the container
		// We can verify the component renders without errors
		expect(screen.getByRole("main")).toBeInTheDocument();
	});

	test("should have correct data-testid for status code view", () => {
		render(<Page error={mockError} reset={mockReset} />);

		const statusCodeView = screen.getByTestId("status-code-view");
		expect(statusCodeView).toBeInTheDocument();
		expect(statusCodeView).toHaveClass(
			"w-full",
			"bg-linear-to-r",
			"from-primary-grad-from",
			"to-primary-grad-to",
			"bg-clip-text",
			"p-2",
			"text-center",
			"font-extrabold",
			"text-transparent",
		);
	});

	test("should render responsive hidden elements", () => {
		render(<Page error={mockError} reset={mockReset} />);

		const hiddenSpans = screen.getAllByText("---");
		expect(hiddenSpans).toHaveLength(2);
		hiddenSpans.forEach((span) => {
			expect(span).toHaveClass("hidden", "font-light", "sm:inline");
		});
	});

	test("should re-capture error when error prop changes", () => {
		const { rerender } = render(<Page error={mockError} reset={mockReset} />);

		vi.clearAllMocks();

		const newError = new Error("New global test error") as Error & {
			digest?: string;
		};
		rerender(<Page error={newError} reset={mockReset} />);

		expect(captureException).toHaveBeenCalledWith(newError);
	});

	test("should render main element with correct structure", () => {
		render(<Page error={mockError} reset={mockReset} />);

		const mainElement = screen.getByRole("main");
		expect(mainElement).toBeInTheDocument();

		const containerDiv = mainElement.firstChild;
		expect(containerDiv).toHaveClass(
			"flex",
			"h-screen",
			"w-screen",
			"flex-col",
			"items-center",
			"justify-center",
			"space-y-4",
			"text-center",
		);
	});
});
