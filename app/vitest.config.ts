import path from "node:path";
import { defineConfig } from "vite-plus/test/config";

export default defineConfig({
	test: {
		environment: "happy-dom",
		setupFiles: ["./vitest-setup.tsx"],
		include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
		exclude: ["./e2e/**/*"],
	},
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "./src"),
			"@s-hirano-ist/s-ui": path.resolve(
				import.meta.dirname,
				"../packages/ui/dist",
			),
			"@s-hirano-ist/s-core": path.resolve(
				import.meta.dirname,
				"../packages/core",
			),
		},
	},
});
