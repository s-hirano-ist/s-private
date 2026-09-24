import assert from "node:assert/strict";
// oxlint-disable-next-line vitest/no-import-node-test -- This guard runs with node --test inside pnpm lint:colors.
import { test } from "node:test";
import { invalidColorUtilities } from "./check-semantic-colors.mjs";

test("rejects palette and arbitrary color utilities with variants and prefixes", () => {
	assert.deepEqual(
		invalidColorUtilities(
			"bg-gray-50 dark:bg-red-500 sui:text-green-600 hover:bg-[#fff] text-(--custom-color)",
		),
		[
			"bg-gray-50",
			"dark:bg-red-500",
			"sui:text-green-600",
			"hover:bg-[#fff]",
			"text-(--custom-color)",
		],
	);
});

test("allows semantic colors and non-color arbitrary values", () => {
	assert.deepEqual(
		invalidColorUtilities(
			"bg-background text-destructive sui:fill-rating border-nav-border/10 text-[10px] bg-linear-to-r border-2 text-transparent shadow-[0_2px_16px_rgb(var(--sui-primary)/0.3)]",
		),
		[],
	);
});
