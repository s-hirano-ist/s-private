import { act, renderHook, waitFor } from "@testing-library/react";
import { ReadonlyURLSearchParams } from "next/dist/client/components/readonly-url-search-params";
import { useRouter, useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useSearch } from "./use-search";

vi.mock("next/navigation");

const mockUseRouter = vi.mocked(useRouter);
const mockUseSearchParams = vi.mocked(useSearchParams);

describe("useSearch", () => {
	const mockPush = vi.fn();
	const mockSearchFn = vi.fn();

	const setupMocks = (initialQuery: string | null = null) => {
		const queryString = initialQuery ? `q=${initialQuery}` : "";
		mockUseSearchParams.mockReturnValue(
			new ReadonlyURLSearchParams(queryString),
		);
		mockUseRouter.mockReturnValue({
			push: mockPush,
			replace: vi.fn(),
			refresh: vi.fn(),
			back: vi.fn(),
			forward: vi.fn(),
			prefetch: vi.fn(),
		});
	};

	beforeEach(() => {
		vi.clearAllMocks();
		setupMocks();
	});

	describe("initialization", () => {
		test("should initialize with empty query when useUrlQuery is false", () => {
			const { result } = renderHook(() =>
				useSearch({ search: mockSearchFn, useUrlQuery: false }),
			);

			expect(result.current.searchQuery).toBe("");
			expect(result.current.searchResults).toBeUndefined();
			expect(result.current.isPending).toBe(false);
		});

		test("should initialize with empty query when useUrlQuery is not provided (default)", () => {
			const { result } = renderHook(() => useSearch({ search: mockSearchFn }));

			expect(result.current.searchQuery).toBe("");
		});

		test("should initialize with URL query when useUrlQuery is true", () => {
			setupMocks("test query");

			const { result } = renderHook(() =>
				useSearch({ search: mockSearchFn, useUrlQuery: true }),
			);

			expect(result.current.searchQuery).toBe("test query");
		});

		test("should initialize with empty query when URL has no q param and useUrlQuery is true", () => {
			setupMocks(null);

			const { result } = renderHook(() =>
				useSearch({ search: mockSearchFn, useUrlQuery: true }),
			);

			expect(result.current.searchQuery).toBe("");
		});
	});

	describe("handleSearchChange", () => {
		test("should update searchQuery on change", () => {
			const { result } = renderHook(() => useSearch({ search: mockSearchFn }));

			act(() => {
				result.current.handleSearchChange({
					target: { value: "new query" },
				} as React.ChangeEvent<HTMLInputElement>);
			});

			expect(result.current.searchQuery).toBe("new query");
		});

		test("should allow clearing the query", () => {
			const { result } = renderHook(() => useSearch({ search: mockSearchFn }));

			act(() => {
				result.current.handleSearchChange({
					target: { value: "test" },
				} as React.ChangeEvent<HTMLInputElement>);
			});

			act(() => {
				result.current.handleSearchChange({
					target: { value: "" },
				} as React.ChangeEvent<HTMLInputElement>);
			});

			expect(result.current.searchQuery).toBe("");
		});
	});

	describe("executeSearch", () => {
		test("should call search function with correct query", async () => {
			mockSearchFn.mockResolvedValue({
				success: true,
				data: { results: [] },
			});

			const { result } = renderHook(() => useSearch({ search: mockSearchFn }));

			act(() => {
				result.current.handleSearchChange({
					target: { value: "test search" },
				} as React.ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				await result.current.executeSearch();
			});

			expect(mockSearchFn).toHaveBeenCalledWith({
				query: "test search",
				limit: 50,
			});
		});

		test("should set results to undefined when query is empty", async () => {
			mockSearchFn.mockResolvedValue({
				success: true,
				data: {
					results: [
						{
							href: "/test",
							contentType: "articles",
							title: "Test",
							url: "https://example.com",
							snippet: "snippet",
							category: { id: "1", name: "Tech" },
						},
					],
				},
			});

			const { result } = renderHook(() => useSearch({ search: mockSearchFn }));

			// First set some results
			act(() => {
				result.current.handleSearchChange({
					target: { value: "test" },
				} as React.ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				await result.current.executeSearch();
			});

			// Then clear the query
			act(() => {
				result.current.handleSearchChange({
					target: { value: "" },
				} as React.ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				await result.current.executeSearch();
			});

			expect(result.current.searchResults).toBeUndefined();
		});

		test("should update search results on successful search", async () => {
			const mockResults = {
				success: true,
				data: {
					results: [
						{
							href: "/articles/1",
							contentType: "articles",
							title: "Article 1",
							url: "https://example.com",
							snippet: "article snippet",
							category: { id: "1", name: "Tech" },
						},
						{
							href: "/books/2",
							contentType: "books",
							title: "Book 1",
							snippet: "book snippet",
							rating: 5,
							tags: ["programming"],
						},
					],
				},
			};
			mockSearchFn.mockResolvedValue(mockResults);

			const { result } = renderHook(() => useSearch({ search: mockSearchFn }));

			act(() => {
				result.current.handleSearchChange({
					target: { value: "test" },
				} as React.ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				await result.current.executeSearch();
			});

			await waitFor(() => {
				expect(result.current.searchResults).toEqual([
					{
						href: "/articles/1",
						contentType: "articles",
						title: "Article 1",
						url: "https://example.com",
						snippet: "article snippet",
						category: "Tech",
					},
					{
						href: "/books/2",
						contentType: "books",
						title: "Book 1",
						url: undefined,
						snippet: "book snippet",
						category: undefined,
					},
				]);
			});
		});

		test("should not update results when search fails", async () => {
			mockSearchFn.mockResolvedValue({
				success: false,
				message: "error",
			});

			const { result } = renderHook(() => useSearch({ search: mockSearchFn }));

			act(() => {
				result.current.handleSearchChange({
					target: { value: "test" },
				} as React.ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				await result.current.executeSearch();
			});

			expect(result.current.searchResults).toEqual([]);
			expect(result.current.isError).toBe(true);
		});
	});

	describe("URL update with useUrlQuery", () => {
		test("should update URL when useUrlQuery is true and query is set", async () => {
			mockSearchFn.mockResolvedValue({
				success: true,
				data: { results: [] },
			});

			const { result } = renderHook(() =>
				useSearch({ search: mockSearchFn, useUrlQuery: true }),
			);

			act(() => {
				result.current.handleSearchChange({
					target: { value: "test query" },
				} as React.ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				await result.current.executeSearch();
			});

			expect(mockPush).toHaveBeenCalledWith("?q=test+query");
		});

		test("should remove q param from URL when query is empty", async () => {
			mockSearchFn.mockResolvedValue({
				success: true,
				data: { results: [] },
			});

			const { result } = renderHook(() =>
				useSearch({ search: mockSearchFn, useUrlQuery: true }),
			);

			await act(async () => {
				await result.current.executeSearch();
			});

			expect(mockPush).toHaveBeenCalledWith("?");
		});

		test("should not update URL when useUrlQuery is false", async () => {
			mockSearchFn.mockResolvedValue({
				success: true,
				data: { results: [] },
			});

			const { result } = renderHook(() =>
				useSearch({ search: mockSearchFn, useUrlQuery: false }),
			);

			act(() => {
				result.current.handleSearchChange({
					target: { value: "test" },
				} as React.ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				await result.current.executeSearch();
			});

			expect(mockPush).not.toHaveBeenCalled();
		});
	});

	describe("isPending state", () => {
		test("should be false initially", () => {
			const { result } = renderHook(() => useSearch({ search: mockSearchFn }));

			expect(result.current.isPending).toBe(false);
		});
	});

	describe("query trimming", () => {
		test("should trim whitespace from query when searching", async () => {
			mockSearchFn.mockResolvedValue({
				success: true,
				data: { results: [] },
			});

			const { result } = renderHook(() => useSearch({ search: mockSearchFn }));

			act(() => {
				result.current.handleSearchChange({
					target: { value: "  test query  " },
				} as React.ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				await result.current.executeSearch();
			});

			expect(mockSearchFn).toHaveBeenCalledWith({
				query: "test query",
				limit: 50,
			});
		});
	});
});
