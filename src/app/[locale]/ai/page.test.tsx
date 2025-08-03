import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import Page from "./page";

// Mock StatusCodeView
vi.mock("@/components/card/status-code-view", () => ({
	// eslint-disable-next-line
	StatusCodeView: ({ statusCode }: any) => (
		<div data-status-code={statusCode} data-testid="status-code-view">
			Status: {statusCode}
		</div>
	),
}));

describe("AI Page", () => {
	test("should render StatusCodeView component", () => {
		render(<Page />);

		expect(screen.getByTestId("status-code-view")).toBeInTheDocument();
	});

	test("should pass correct status code", () => {
		render(<Page />);

		const statusView = screen.getByTestId("status-code-view");
		expect(statusView).toHaveAttribute("data-status-code", "000");
	});

	test("should display status code in content", () => {
		render(<Page />);

		expect(screen.getByText("Status: 000")).toBeInTheDocument();
	});
});
