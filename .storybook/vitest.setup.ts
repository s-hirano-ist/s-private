import { vi } from "vitest";

// Mock next-intl/server for RSC components in Storybook testing
vi.mock("next-intl/server", () => ({
	getTranslations: vi.fn(async () => (key: string) => key),
	getLocale: vi.fn(async () => "ja"),
	getNow: vi.fn(async () => new Date()),
	getTimeZone: vi.fn(async () => "Asia/Tokyo"),
}));
