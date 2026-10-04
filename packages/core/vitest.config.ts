import path from "node:path";
import { defineConfig } from "vite-plus/test/config";

export default defineConfig({
	test: {
		root: import.meta.dirname,
		setupFiles: [path.resolve(import.meta.dirname, "vitest-setup.tsx")],
		include: ["./**/*.test.?(c|m)[jt]s?(x)"],
	},
});
