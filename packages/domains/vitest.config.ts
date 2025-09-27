import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest-setup.tsx"],
		coverage: {
			enabled: true,
			reportOnFailure: true,
			reportsDirectory: "./.vitest-coverage",
			include: ["src/**"],
			exclude: [],
			reporter: ["text", "json-summary", "json"],
		},
		include: ["./**/*.test.?(c|m)[jt]s?(x)"],
		typecheck: {
			enabled: true,
			include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
			tsconfig: "./tsconfig.json",
		},
	},
});
