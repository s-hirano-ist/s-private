import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect, vi } from "vite-plus/test";

expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});
