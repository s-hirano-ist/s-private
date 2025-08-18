import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useSearchableList } from "./use-searchable-list";

// Mock next/navigation
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => mockSearchParams,
}));

vi.mock("use-debounce", () => ({
	useDebouncedCallback: vi.fn().mockImplementation((callback, _delay) => {
		// Return a mocked function that tracks calls
		const mockFn = vi.fn().mockImplementation((...args) => {
			// Call the original callback without debouncing for tests
			return callback(...args);
		});
		return mockFn;
	}),
}));

describe("useSearchableList", () => {
	const testData = [
		{ title: "Apple", id: "1" },
		{ title: "Banana", id: "2" },
		{ title: "Cherry", id: "3" },
		{ title: "Date", id: "4" },
	];

	// Create stable filter function to prevent infinite re-renders
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const stableFilterFunction = (item: any, searchQuery: string) =>
		item.title.toLowerCase().includes(searchQuery.toLowerCase());

	beforeEach(() => {
		vi.clearAllMocks();
		// Clear all parameters
		for (const key of mockSearchParams.keys()) {
			mockSearchParams.delete(key);
		}
	});

	test("should initialize with all data when no search query", () => {
		const { result } = renderHook(() =>
			useSearchableList({
				data: testData,
				filterFunction: stableFilterFunction,
			}),
		);

		expect(result.current.searchQuery).toBe("");
		expect(result.current.searchResults).toEqual(testData);
	});

	test("should initialize with URL query when useUrlQuery is enabled", () => {
		mockSearchParams.set("q", "apple");

		const { result } = renderHook(() =>
			useSearchableList({
				data: testData,
				filterFunction: stableFilterFunction,
				useUrlQuery: true,
			}),
		);

		expect(result.current.searchQuery).toBe("apple");
	});

	test("should filter data based on search query", async () => {
		const { result } = renderHook(() =>
			useSearchableList({
				data: testData,
				filterFunction: stableFilterFunction,
			}),
		);

		const mockEvent = {
			target: { value: "a" },
		} as React.ChangeEvent<HTMLInputElement>;

		act(() => {
			result.current.handleSearchChange(mockEvent);
		});

		expect(result.current.searchQuery).toBe("a");
		expect(result.current.searchResults).toEqual([
			{ title: "Apple", id: "1" },
			{ title: "Banana", id: "2" },
			{ title: "Date", id: "4" },
		]);
	});

	test("should update URL when useUrlQuery is enabled", () => {
		const { result } = renderHook(() =>
			useSearchableList({
				data: testData,
				filterFunction: stableFilterFunction,
				useUrlQuery: true,
			}),
		);

		const mockEvent = {
			target: { value: "apple" },
		} as React.ChangeEvent<HTMLInputElement>;

		act(() => {
			result.current.handleSearchChange(mockEvent);
		});

		expect(mockPush).toHaveBeenCalledWith("?q=apple");
	});

	test("should remove URL param when search query is empty and useUrlQuery is enabled", () => {
		mockSearchParams.set("q", "existing");

		const { result } = renderHook(() =>
			useSearchableList({
				data: testData,
				filterFunction: stableFilterFunction,
				useUrlQuery: true,
			}),
		);

		const mockEvent = {
			target: { value: "" },
		} as React.ChangeEvent<HTMLInputElement>;

		act(() => {
			result.current.handleSearchChange(mockEvent);
		});

		expect(mockPush).toHaveBeenCalledWith("?");
	});

	test("should use custom filter function", () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const customFilter = (item: any, searchQuery: string) =>
			item.id === searchQuery;

		const { result } = renderHook(() =>
			useSearchableList({
				data: testData,
				filterFunction: customFilter,
			}),
		);

		const mockEvent = {
			target: { value: "2" },
		} as React.ChangeEvent<HTMLInputElement>;

		act(() => {
			result.current.handleSearchChange(mockEvent);
		});

		expect(result.current.searchResults).toEqual([
			{ title: "Banana", id: "2" },
		]);
	});

	test("should update results when data changes", () => {
		const { result, rerender } = renderHook(
			({ data }) =>
				useSearchableList({
					data,
					filterFunction: stableFilterFunction,
				}),
			{
				initialProps: { data: testData },
			},
		);

		expect(result.current.searchResults).toEqual(testData);

		const newData = [{ title: "Elderberry", id: "5" }];
		rerender({ data: newData });

		expect(result.current.searchResults).toEqual(newData);
	});

	test("should maintain search when data changes", () => {
		const { result, rerender } = renderHook(
			({ data }) =>
				useSearchableList({
					data,
					filterFunction: stableFilterFunction,
				}),
			{
				initialProps: { data: testData },
			},
		);

		// Set search query
		const mockEvent = {
			target: { value: "a" },
		} as React.ChangeEvent<HTMLInputElement>;

		act(() => {
			result.current.handleSearchChange(mockEvent);
		});

		// Update data
		const newData = [
			{ title: "Avocado", id: "5" },
			{ title: "Blueberry", id: "6" },
		];
		rerender({ data: newData });

		expect(result.current.searchResults).toEqual([
			{ title: "Avocado", id: "5" },
		]);
	});
});
