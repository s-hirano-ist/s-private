import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "./page";

// Mock StatusCodeView
vi.mock("@/components/card/status-code-view", () => ({
	StatusCodeView: ({ statusCode }: any) => (
		<div data-testid="status-code-view" data-status-code={statusCode}>
			Status: {statusCode}
		</div>
	),
}));

describe("Search Page", () => {
	it("should render StatusCodeView component", () => {
		render(<Page />);

		expect(screen.getByTestId("status-code-view")).toBeInTheDocument();
	});

	it("should pass correct status code", () => {
		render(<Page />);

		const statusView = screen.getByTestId("status-code-view");
		expect(statusView).toHaveAttribute("data-status-code", "000");
	});

	it("should display status code in content", () => {
		render(<Page />);

		expect(screen.getByText("Status: 000")).toBeInTheDocument();
	});
});
