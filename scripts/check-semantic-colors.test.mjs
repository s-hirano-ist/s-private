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

test("iOS content colors match the Web light and dark semantic tokens", async () => {
	const root = join(import.meta.dirname, "..");
	const stylesheet = await readFile(
		join(root, "packages/ui/src/styles.css"),
		"utf8",
	);
	const light = stylesheet.match(/:root\s*\{([^}]+)\}/u)?.[1];
	const dark = stylesheet.match(
		/\.dark,\s*\[data-theme="dark"\]\s*\{([^}]+)\}/u,
	)?.[1];
	assert.ok(light, "Web light token block must exist");
	assert.ok(dark, "Web dark token block must exist");
	const mappings = {
		AppBackground: "background",
		AppForeground: "foreground",
		AppMuted: "muted",
		AppMutedForeground: "muted-foreground",
		AppPrimary: "primary",
		AppDestructive: "destructive",
		AppSuccess: "success",
	};
	for (const [asset, token] of Object.entries(mappings)) {
		const catalog = JSON.parse(
			await readFile(
				join(
					root,
					"ios/SPrivate/Assets.xcassets",
					`${asset}.colorset`,
					"Contents.json",
				),
				"utf8",
			),
		);
		assert.equal(
			catalog.colors.length,
			4,
			`${asset} must include light, dark, and high contrast variants`,
		);
		for (const [index, tokens] of [light, dark].entries()) {
			const values = tokens.match(
				new RegExp(`--sui-${token}: (\\d+) (\\d+) (\\d+);`, "u"),
			);
			assert.ok(values, `Missing Web token ${token}`);
			const components = catalog.colors[index].color.components;
			assert.deepEqual(
				[components.red, components.green, components.blue].map(Number),
				values.slice(1).map(Number),
				`${asset} differs from Web ${["light", "dark"][index]} token`,
			);
		}
		assert.deepEqual(catalog.colors[2].appearances, [
			{ appearance: "contrast", value: "high" },
		]);
		assert.deepEqual(catalog.colors[3].appearances, [
			{ appearance: "luminosity", value: "dark" },
			{ appearance: "contrast", value: "high" },
		]);
	}
});
