import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		setupFiles: ["./vitest-setup.tsx"],
		include: ["./**/*.test.?(c|m)[jt]s?(x)"],
	},
});
