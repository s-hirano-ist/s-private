import { defineConfig } from "vitest/config";

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
				"src/app/**/?(layout|page).tsx",
				"src/app/\\[locale\\]/forbidden.tsx",
				"src/app/api/auth/\\[...nextauth\\]/route.ts",
				"src/app/api/sign-in/route.ts",
				"src/env.ts",
				"src/infrastructures/auth/?(auth|auth.config).ts",
				"src/components/common/providers/**/*.tsx",
				"src/infrastructures/observability/**/*.ts",
				"**/types.ts",
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
