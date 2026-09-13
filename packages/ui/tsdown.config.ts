import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"src/*.tsx",
		"src/hooks/*.ts",
		"src/utils/*.ts",
		"!src/**/*.stories.tsx",
		"!src/**/*.test.ts",
		"!src/**/*.test.tsx",
	],
	format: "esm",
	fixedExtension: false,
	target: "es2025",
	sourcemap: true,
	dts: false,
	clean: true,
	splitting: true,
	deps: {
		neverBundle: true,
	},
});
