import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		root: import.meta.dirname,
		setupFiles: [path.resolve(import.meta.dirname, "vitest-setup.tsx")],
		include: ["./**/*.test.?(c|m)[jt]s?(x)"],
		typecheck: {
			enabled: true,
			include: ["./**/*.test.?(c|m)[jt]s?(x)"],
			tsconfig: "./tsconfig.json",
		},
	},
});
