import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

dotenv.config({ path: ".env.test" });

export default defineConfig({
	esbuild: {
		jsxInject: 'import React from "react"',
	},
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
				"src/app/**/?(layout|page|_page).tsx",
				"src/utils/auth/?(auth|auth.config).ts",
				"**/types.ts",
				"src/components/provider/theme-provider.tsx",
				"src/?(instrumentation-client|instrumentation|minio|middleware|pino|prisma).ts",
				"src/app/?(manifest.ts|loading.tsx|robots.ts|not-found.tsx|instrumentation.ts)",
			],
			reporter: ["text", "json-summary", "json"],
		},
		include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
		exclude: ["./e2e/**/*"],
		server: { deps: { inline: ["next-auth"] } }, // FIXME: https://github.com/vitest-dev/vitest/issues/4554
	},
	resolve: { alias: { "@": "/src" } },
});
