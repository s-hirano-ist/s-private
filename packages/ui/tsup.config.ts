import { defineConfig } from "tsup";

export default defineConfig((options) => ({
	entry: [
		"src/*.tsx",
		"src/hooks/*.ts",
		"src/utils/*.ts",
		"!src/**/*.stories.tsx",
		"!src/**/*.test.ts",
		"!src/**/*.test.tsx",
	],
	format: ["esm"],
	target: "es2025",
	sourcemap: true,

	// watch 起動時は dist を消さない
	clean: !options.watch,

	splitting: true,
	external: ["react", "react-dom", /^lucide-react\//u, /^@base-ui\/react\//u],
}));
