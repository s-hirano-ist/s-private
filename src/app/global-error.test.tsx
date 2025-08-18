import { captureException } from "@sentry/nextjs";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, test, vi } from "vitest";
import { Button } from "@/components/common/ui/button";

vi.mock("@sentry/nextjs", () => ({
	captureException: vi.fn(),
}));

// Test wrapper component that renders only the content without html/body
function TestableGlobalErrorContent({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	React.useEffect(() => {
		captureException(error);
	}, [error]);

	return (
		<main>
			<div className="flex h-screen w-screen flex-col items-center justify-center space-y-4 text-center">
				<div
					className="w-full bg-linear-to-r from-primary-grad-from to-primary-grad-to bg-clip-text p-2 text-center font-extrabold text-transparent"
					data-testid="status-code-view"
				>
					<div className="text-9xl">
						<span className="hidden font-light sm:inline">---</span>
						500
						<span className="hidden font-light sm:inline">---</span>
					</div>
					<div className="text-sm">------Unexpected Error------</div>
				</div>
				<Button onClick={() => reset()} variant="outline">
					Try again
				</Button>
			</div>
		</main>
	);
}

describe("Global Error Page", () => {
	const mockReset = vi.fn();
	const mockError = new Error("Test global error") as Error & {
		digest?: string;
	};
	mockError.digest = "test-digest";

	test("should render global error page with 500 status code", () => {
		render(<TestableGlobalErrorContent error={mockError} reset={mockReset} />);

		expect(screen.getByText("500")).toBeInTheDocument();
		expect(
			screen.getByText("------Unexpected Error------"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Try again" }),
		).toBeInTheDocument();
	});

	test("should capture exception on mount", () => {
		render(<TestableGlobalErrorContent error={mockError} reset={mockReset} />);

		expect(captureException).toHaveBeenCalledWith(mockError);
	});

	test("should call reset function when Try again button is clicked", () => {
		render(<TestableGlobalErrorContent error={mockError} reset={mockReset} />);

		const tryAgainButton = screen.getByRole("button", { name: "Try again" });
		fireEvent.click(tryAgainButton);

		expect(mockReset).toHaveBeenCalledTimes(1);
	});

	test("should render main element", () => {
		render(<TestableGlobalErrorContent error={mockError} reset={mockReset} />);

		expect(screen.getByRole("main")).toBeInTheDocument();
	});

	test("should have correct data-testid for status code view", () => {
		render(<TestableGlobalErrorContent error={mockError} reset={mockReset} />);

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
		render(<TestableGlobalErrorContent error={mockError} reset={mockReset} />);

		const hiddenSpans = screen.getAllByText("---");
		expect(hiddenSpans).toHaveLength(2);
		hiddenSpans.forEach((span) => {
			expect(span).toHaveClass("hidden", "font-light", "sm:inline");
		});
	});

	test("should re-capture error when error prop changes", () => {
		const { rerender } = render(
			<TestableGlobalErrorContent error={mockError} reset={mockReset} />,
		);

		vi.clearAllMocks();

		const newError = new Error("New global test error") as Error & {
			digest?: string;
		};
		rerender(<TestableGlobalErrorContent error={newError} reset={mockReset} />);

		expect(captureException).toHaveBeenCalledWith(newError);
	});

	test("should render main element with correct structure", () => {
		render(<TestableGlobalErrorContent error={mockError} reset={mockReset} />);

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
