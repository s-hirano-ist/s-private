import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { BooksCounter } from "./books-counter";

vi.mock("@/common/auth/session", () => ({
	hasViewerAdminPermission: vi.fn(),
}));

vi.mock("@/applications/books/get-books", () => ({
	getBooksCount: vi.fn(),
}));

vi.mock("@/common/components/badge-with-pagination", () => ({
	// eslint-disable-next-line
	BadgeWithPagination: ({ currentPage, label, totalItems }: any) => (
		<div data-testid="badge-with-pagination">
			<span>Current Page: {currentPage}</span>
			<span>Label: {label}</span>
			<span>Total Items: {totalItems}</span>
		</div>
	),
}));

vi.mock("@/common/components/status/unexpected", () => ({
	// eslint-disable-next-line
	Unexpected: ({ caller, error }: any) => (
		<div data-testid="unexpected-error">
			<span>Caller: {caller}</span>
			<span>Error: {error.message}</span>
		</div>
	),
}));

const { hasViewerAdminPermission } = await import("@/common/auth/session");
const { getBooksCount } = await import("@/applications/books/get-books");
const { forbidden } = await import("next/navigation");

describe("BooksCounter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should call forbidden when user doesn't have permission", async () => {
		vi.mocked(hasViewerAdminPermission).mockResolvedValue(false);

		await expect(BooksCounter()).rejects.toThrow("FORBIDDEN");
		expect(forbidden).toHaveBeenCalled();
	});

	test("should render BadgeWithPagination when user has permission and count is successful", async () => {
		vi.mocked(hasViewerAdminPermission).mockResolvedValue(true);
		vi.mocked(getBooksCount).mockResolvedValue(42);

		const result = await BooksCounter();
		// eslint-disable-next-line
		render(result as any);

		expect(screen.getByTestId("badge-with-pagination")).toBeInTheDocument();
		expect(screen.getByText("Current Page: 1")).toBeInTheDocument();
		expect(screen.getByText("Label: totalBooks")).toBeInTheDocument();
		expect(screen.getByText("Total Items: 42")).toBeInTheDocument();
		expect(getBooksCount).toHaveBeenCalledWith("EXPORTED");
	});

	test("should render Unexpected when getBooksCount throws an error", async () => {
		vi.mocked(hasViewerAdminPermission).mockResolvedValue(true);
		const error = new Error("Database error");
		vi.mocked(getBooksCount).mockRejectedValue(error);

		const result = await BooksCounter();
		// eslint-disable-next-line
		render(result as any);

		expect(screen.getByTestId("unexpected-error")).toBeInTheDocument();
		expect(screen.getByText("Caller: BooksCounter")).toBeInTheDocument();
		expect(screen.getByText("Error: Database error")).toBeInTheDocument();
	});

	test("should render Unexpected when getBooksCount returns 0", async () => {
		vi.mocked(hasViewerAdminPermission).mockResolvedValue(true);
		vi.mocked(getBooksCount).mockResolvedValue(0);

		const result = await BooksCounter();
		// eslint-disable-next-line
		render(result as any);

		expect(screen.getByTestId("badge-with-pagination")).toBeInTheDocument();
		expect(screen.getByText("Total Items: 0")).toBeInTheDocument();
	});
});
