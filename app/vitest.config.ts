import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	esbuild: {
		jsx: "automatic",
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest-setup.tsx"],
		include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
		exclude: ["./e2e/**/*"],
		server: { deps: { inline: ["next-auth"] } }, // FIXME: https://github.com/vitest-dev/vitest/issues/4554
		typecheck: {
			enabled: true,
			include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
			tsconfig: "./tsconfig.json",
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"s-private-components": path.resolve(__dirname, "../packages/components"),
			"s-private-domains": path.resolve(__dirname, "../packages/domains"),
		},
	},
});
