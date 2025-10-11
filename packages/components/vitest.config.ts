import { defineConfig } from "vitest/config";

export default defineConfig({
	esbuild: {
		jsx: "automatic",
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest-setup.tsx"],
		coverage: {
			enabled: true,
			reportOnFailure: true,
			reportsDirectory: "./.vitest-coverage",
			include: ["./**/*.{ts,tsx}"],
			exclude: [
				"**/*.stories.tsx",
				"**/*.test.ts?(x)",
				"**/types.ts",
				"**/dist/**",
			],
			reporter: ["text", "json-summary", "json"],
		},
		include: ["./**/*.test.?(c|m)[jt]s?(x)"],
		typecheck: {
			enabled: true,
			include: ["./**/*.test.?(c|m)[jt]s?(x)"],
			tsconfig: "./tsconfig.json",
		},
	},
});
