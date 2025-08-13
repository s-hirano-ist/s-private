import { captureException } from "@sentry/nextjs";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { clientLogger } from "@/infrastructure/client";
import Page from "./error";

vi.mock("@sentry/nextjs", () => ({
	captureException: vi.fn(),
}));

describe("Error Page", () => {
	const mockReset = vi.fn();
	const mockError = new Error("Test error") as Error & { digest?: string };
	mockError.digest = "test-digest";

	test("should render error page with 500 status code", () => {
		render(<Page error={mockError} reset={mockReset} />);

		expect(screen.getByText("500")).toBeInTheDocument();
		expect(
			screen.getByText("------Unexpected Error------"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Try again" }),
		).toBeInTheDocument();
	});

	test("should log error and capture exception on mount", () => {
		render(<Page error={mockError} reset={mockReset} />);

		expect(clientLogger.error).toHaveBeenCalledWith(
			"Unexpected error occurred.",
			{
				caller: "ErrorPage",
				status: 500,
			},
			mockError,
		);
		expect(captureException).toHaveBeenCalledWith(mockError);
	});

	test("should call reset function when Try again button is clicked", () => {
		render(<Page error={mockError} reset={mockReset} />);

		const tryAgainButton = screen.getByRole("button", { name: "Try again" });
		fireEvent.click(tryAgainButton);

		expect(mockReset).toHaveBeenCalledTimes(1);
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

	test("should re-log error when error prop changes", () => {
		const { rerender } = render(<Page error={mockError} reset={mockReset} />);

		vi.clearAllMocks();

		const newError = new Error("New test error");
		rerender(<Page error={newError} reset={mockReset} />);

		expect(clientLogger.error).toHaveBeenCalledWith(
			"Unexpected error occurred.",
			{
				caller: "ErrorPage",
				status: 500,
			},
			newError,
		);
		expect(captureException).toHaveBeenCalledWith(newError);
	});
});
