import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
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

const appearances = [
	[],
	[{ appearance: "luminosity", value: "dark" }],
	[{ appearance: "contrast", value: "high" }],
	[
		{ appearance: "luminosity", value: "dark" },
		{ appearance: "contrast", value: "high" },
	],
];

function luminance({ red, green, blue }) {
	const linear = [red, green, blue].map((component) => {
		const channel = Number(component) / 255;
		return channel <= 0.04045
			? channel / 12.92
			: ((channel + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

test("iOS semantic colors cover all appearances and meet text contrast", async () => {
	const assets = [
		"AppBackground",
		"AppForeground",
		"AppMuted",
		"AppMutedForeground",
		"AppPrimary",
		"AppDestructive",
		"AppSuccess",
	];
	const colors = new Map();
	for (const asset of assets) {
		const catalog = JSON.parse(
			await readFile(
				join(
					import.meta.dirname,
					"..",
					"apps/ios/SPrivate/Assets.xcassets",
					`${asset}.colorset`,
					"Contents.json",
				),
				"utf8",
			),
		);
		assert.deepEqual(
			catalog.colors.map((variant) => variant.appearances ?? []),
			appearances,
			`${asset} must include light, dark, and both high contrast appearances`,
		);
		colors.set(
			asset,
			catalog.colors.map(({ color }) => {
				assert.equal(color["color-space"], "srgb");
				assert.equal(Number(color.components.alpha), 1);
				return luminance(color.components);
			}),
		);
	}

	const pairs = [
		["AppForeground", "AppBackground"],
		["AppForeground", "AppMuted"],
		["AppMutedForeground", "AppBackground"],
		["AppMutedForeground", "AppMuted"],
		["AppPrimary", "AppBackground"],
		["AppPrimary", "AppMuted"],
		["AppDestructive", "AppBackground"],
		["AppSuccess", "AppBackground"],
	];
	for (const [foreground, background] of pairs) {
		for (const index of appearances.keys()) {
			const values = [
				colors.get(foreground)[index],
				colors.get(background)[index],
			];
			const ratio = (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
			assert.ok(
				ratio >= 4.5,
				`${foreground} against ${background} in variant ${index}: ${ratio.toFixed(2)}:1`,
			);
		}
	}
});
