import { storybookNextJsPlugin } from "@storybook/experimental-nextjs-vite/vite-plugin";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";
dotenv.config({ path: ".env.test" });

export default defineConfig({
	plugins: [storybookNextJsPlugin()],
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest-setup.tsx"],
		coverage: {
			enabled: true,
			reportOnFailure: true,
			reportsDirectory: "./.vitest-coverage",
			include: ["src/**"],
			exclude: [
				"**/*.stories.tsx",
				"src/**/*.test.ts?(x)",
				"src/generated/**/*",
			],
			reporter: ["text", "json-summary", "json"],
		},
		include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
		exclude: ["./e2e/**/*"],
		server: { deps: { inline: ["next-auth"] } }, // FIXME: https://github.com/vitest-dev/vitest/issues/4554
	},
	resolve: { alias: { "@": "/src" } },
});
