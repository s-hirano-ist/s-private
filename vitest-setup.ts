import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
	cleanup();
});

beforeEach(() => {
	vi.clearAllMocks();

	HTMLFormElement.prototype.requestSubmit = function (submitter?: HTMLElement) {
		if (submitter) {
			this.submit();
		} else {
			this.dispatchEvent(
				new Event("submit", { bubbles: true, cancelable: true }),
			);
		}
	};

	vi.mock("@/pino", () => ({
		loggerInfo: vi.fn(),
		loggerWarn: vi.fn(),
		loggerError: vi.fn(),
	}));

	vi.mock("server-only", () => {
		return {};
	});
});

Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // Deprecated
		removeListener: vi.fn(), // Deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

Object.defineProperty(window, "scrollTo", {
	writable: true,
	value: vi.fn(),
});

if (!HTMLFormElement.prototype.requestSubmit) {
	HTMLFormElement.prototype.requestSubmit = function (submitter?: HTMLElement) {
		if (submitter) {
			this.submit();
		} else {
			this.dispatchEvent(
				new Event("submit", { bubbles: true, cancelable: true }),
			);
		}
	};
}
