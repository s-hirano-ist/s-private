import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useSearch } from "./use-search";

describe("useSearch", () => {
	const mockSearchFn = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("initialization", () => {
		test("should initialize with empty query", () => {
			const { result } = renderHook(() => useSearch({ search: mockSearchFn }));

			expect(result.current.searchQuery).toBe("");
			expect(result.current.searchResults).toBeUndefined();
			expect(result.current.isPending).toBe(false);
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
