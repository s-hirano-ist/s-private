/// <reference types="@vitest/browser/providers/playwright" />

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "vite-plus/test" {
	interface Assertion<T = any> extends TestingLibraryMatchers<any, T> {}
}
