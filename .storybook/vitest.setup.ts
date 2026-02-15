import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/nextjs-vite";
import * as nextIntlAnnotations from "storybook-next-intl/preview";
import { vi } from "vitest";
import * as projectAnnotations from "./preview";

// Mock Next.js navigation functions for Storybook testing
vi.mock("next/navigation", () => ({
	notFound: vi.fn(),
	redirect: vi.fn(),
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
		prefetch: vi.fn(),
	})),
	usePathname: vi.fn(() => "/"),
	useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock next-intl/server for RSC components in Storybook testing
vi.mock("next-intl/server", () => ({
	getTranslations: vi.fn(async () => (key: string) => key),
	getLocale: vi.fn(async () => "ja"),
	getNow: vi.fn(async () => new Date()),
	getTimeZone: vi.fn(async () => "Asia/Tokyo"),
}));

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([
	a11yAddonAnnotations,
	nextIntlAnnotations,
	projectAnnotations,
]);
