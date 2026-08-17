import { defineConfig } from "tsup";

export default defineConfig({
	entry: [
		"src/*.tsx",
		"src/hooks/*.ts",
		"src/utils/*.ts",
		"!src/**/*.stories.tsx",
		"!src/**/*.test.ts",
		"!src/**/*.test.tsx",
	],
	format: ["esm"],
	target: "es2022",
	dts: true,
	sourcemap: true,
	clean: true,
	splitting: true,
	external: ["react", "react-dom", /^lucide-react\//u, /^@base-ui\/react\//u],
});
