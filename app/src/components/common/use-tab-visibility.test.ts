import { act, renderHook } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useTabVisibility } from "./use-tab-visibility";

vi.mock("next/navigation");

const mockUseSearchParams = vi.mocked(useSearchParams);

describe("useTabVisibility", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("basic visibility functionality", () => {
		test("should return isVisible true when tab matches current tab", () => {
			const mockSearchParams = {
				get: vi.fn().mockReturnValue("articles"),
			};
			mockUseSearchParams.mockReturnValue(
				mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
			);

			const { result } = renderHook(() => useTabVisibility("articles"));

			expect(result.current.isVisible).toBe(true);
		});

		test("should return isVisible false when tab does not match current tab", () => {
			const mockSearchParams = {
				get: vi.fn().mockReturnValue("notes"),
			};
			mockUseSearchParams.mockReturnValue(
				mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
			);

			const { result } = renderHook(() => useTabVisibility("articles"));

			expect(result.current.isVisible).toBe(false);
		});

		test("should default to 'articles' tab when no tab param is provided", () => {
			const mockSearchParams = {
				get: vi.fn().mockReturnValue(null),
			};
			mockUseSearchParams.mockReturnValue(
				mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
			);

			const { result } = renderHook(() => useTabVisibility("articles"));

			expect(result.current.isVisible).toBe(true);
		});
	});

	describe("shouldLoad functionality", () => {
		test("should return shouldLoad true when currently visible", () => {
			const mockSearchParams = {
				get: vi.fn().mockReturnValue("articles"),
			};
			mockUseSearchParams.mockReturnValue(
				mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
			);

			const { result } = renderHook(() => useTabVisibility("articles"));

			expect(result.current.shouldLoad).toBe(true);
		});

		test("should keep shouldLoad true after being visible once", () => {
			const mockSearchParams = {
				get: vi.fn().mockReturnValue("articles"),
			};
			mockUseSearchParams.mockReturnValue(
				mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
			);

			const { result, rerender } = renderHook(() =>
				useTabVisibility("articles"),
			);

			// Initially visible
			expect(result.current.shouldLoad).toBe(true);

			// Change to different tab
			mockSearchParams.get.mockReturnValue("notes");
			rerender();

			// Should still be true because it was visible once
			expect(result.current.shouldLoad).toBe(true);
		});

		test("should return shouldLoad false for tab that has never been visible", () => {
			const mockSearchParams = {
				get: vi.fn().mockReturnValue("notes"),
			};

			mockUseSearchParams.mockReturnValue(
				mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
			);

			const { result } = renderHook(() => useTabVisibility("books"));

			expect(result.current.shouldLoad).toBe(false);
		});
	});

	describe("preloading functionality", () => {
		test("should enable preloading after 1 second when loadingStrategy is preload", () => {
			const mockSearchParams = {
				get: vi.fn().mockReturnValue("articles"),
			};

			mockUseSearchParams.mockReturnValue(
				mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
			);

			const { result } = renderHook(() => useTabVisibility("books", "preload"));

			// Initially no preloading
			expect(result.current.shouldPreload).toBe(false);

			// Fast-forward 1 second
			act(() => {
				vi.advanceTimersByTime(1000);
			});

			expect(result.current.shouldPreload).toBe(true);
		});

		test("should not enable preloading when loadingStrategy is lazy", () => {
			const mockSearchParams = {
				get: vi.fn().mockReturnValue("articles"),
			};

			mockUseSearchParams.mockReturnValue(
				mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
			);

			const { result } = renderHook(() => useTabVisibility("books", "lazy"));

			act(() => {
				vi.advanceTimersByTime(1000);
			});

			expect(result.current.shouldPreload).toBe(false);
		});

		test("should not enable preloading for currently visible tab", () => {
			const mockSearchParams = {
				get: vi.fn().mockReturnValue("articles"),
			};

			mockUseSearchParams.mockReturnValue(
				mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
			);

			const { result } = renderHook(() =>
				useTabVisibility("articles", "preload"),
			);

			act(() => {
				vi.advanceTimersByTime(1000);
			});

			expect(result.current.shouldPreload).toBe(false);
		});

		test("should clear timeout when component unmounts", () => {
			const mockSearchParams = {
				get: vi.fn().mockReturnValue("articles"),
			};

			mockUseSearchParams.mockReturnValue(
				mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
			);

			const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

			const { unmount } = renderHook(() =>
				useTabVisibility("books", "preload"),
			);

			unmount();

			expect(clearTimeoutSpy).toHaveBeenCalled();
		});
	});

	describe("tab switching scenarios", () => {
		test("should update visibility when tab changes", () => {
			const mockSearchParams = {
				get: vi.fn().mockReturnValue("articles"),
			};

			mockUseSearchParams.mockReturnValue(
				mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
			);

			const { result, rerender } = renderHook(() =>
				useTabVisibility("articles"),
			);

			expect(result.current.isVisible).toBe(true);

			// Switch to notes tab
			mockSearchParams.get.mockReturnValue("notes");
			rerender();

			expect(result.current.isVisible).toBe(false);

			// Switch back to articles tab
			mockSearchParams.get.mockReturnValue("articles");
			rerender();

			expect(result.current.isVisible).toBe(true);
		});

		test("should handle hasBeenVisible state correctly during tab switches", () => {
			const mockSearchParams = {
				get: vi.fn().mockReturnValue("notes"),
			};

			mockUseSearchParams.mockReturnValue(
				mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
			);

			const { result, rerender } = renderHook(() =>
				useTabVisibility("articles"),
			);

			// Initially not visible and never been visible
			expect(result.current.shouldLoad).toBe(false);

			// Switch to articles tab
			mockSearchParams.get.mockReturnValue("articles");
			rerender();

			// Now visible and should load
			expect(result.current.shouldLoad).toBe(true);

			// Switch away from articles tab
			mockSearchParams.get.mockReturnValue("books");
			rerender();

			// No longer visible but should still load because it was visible once
			expect(result.current.isVisible).toBe(false);
			expect(result.current.shouldLoad).toBe(true);
		});
	});
});
