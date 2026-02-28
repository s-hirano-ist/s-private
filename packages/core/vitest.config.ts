import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		root: import.meta.dirname,
		setupFiles: ["./vitest-setup.tsx"],
		include: ["./**/*.test.?(c|m)[jt]s?(x)"],
		typecheck: {
			enabled: true,
			include: ["./**/*.test.?(c|m)[jt]s?(x)"],
			tsconfig: "./tsconfig.json",
		},
	},
});
