import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, vi } from "vite-plus/test";

expect.extend(matchers);

vi.mock("@/env", () => ({
	env: {
		NODE_ENV: "test",
		BACKEND_URL: "https://backend.example",
		BETTER_AUTH_URL: "http://localhost:3000",
		LOCAL_DEV_MODE: "false",
		NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: "test-public-key",
		NEXT_PUBLIC_SENTRY_DSN: "https://example.com/sentry-dsn",
	},
}));

vi.mock("next/headers", () => ({
	headers: vi.fn(async () => new Headers()),
	cookies: vi.fn(async () => ({
		get: vi.fn(),
		getAll: vi.fn(() => []),
		set: vi.fn(),
		delete: vi.fn(),
	})),
}));

vi.mock("server-only", () => {
	return {};
});

vi.mock("next/cache", () => ({
	cacheTag: vi.fn(),
	unstable_cache: vi.fn(
		(callback: (...args: unknown[]) => unknown) => callback,
	),
	revalidateTag: vi.fn(),
	updateTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	redirect: vi.fn(),
	forbidden: vi.fn(() => {
		throw new Error("FORBIDDEN");
	}),
	unauthorized: vi.fn(() => {
		throw new Error("UNAUTHORIZED");
	}),
}));

vi.mock("next/server", () => ({
	NextResponse: {
		json: vi.fn((data, options = {}) => ({
			json: async () => data,
			status: options.status || 200,
			headers: new Headers(),
		})),
	},
}));

afterEach(() => {
	cleanup();
});

beforeEach(() => {
	vi.clearAllMocks();
});
