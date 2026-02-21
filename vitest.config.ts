import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/**
 * Vitest Workspace Configuration
 * Integrates test suites across app and packages using test.projects
 */
export default defineConfig({
	test: {
		projects: [
			{
				extends: true,
				plugins: [
					// The plugin will run tests for the stories defined in your Storybook config
					// See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
					storybookTest(),
				],
				test: {
					name: "storybook",
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(),
						instances: [{ browser: "chromium" }],
					},
					setupFiles: [".storybook/vitest.setup.ts"],
				},
			},

			// Main Next.js application with Storybook integration
			{
				extends: "./app/vitest.config.ts",
				test: {
					name: "app",
					root: "./app",
					include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
				},
			},
			// UI Components package
			{
				extends: "./packages/ui/vitest.config.ts",
				test: {
					name: "components",
					root: "./packages/ui",
					include: ["./**/*.test.?(c|m)[jt]s?(x)"],
				},
			},
			// Core domain logic package
			{
				extends: "./packages/core/vitest.config.ts",
				test: {
					name: "core",
					root: "./packages/core",
					include: ["./**/*.test.?(c|m)[jt]s?(x)"],
				},
			},
			// Notification package
			{
				extends: "./packages/notification/vitest.config.ts",
				test: {
					name: "notification",
					root: "./packages/notification",
					include: ["./**/*.test.?(c|m)[jt]s?(x)"],
				},
			},
			// Search package
			{
				test: {
					name: "search",
					root: "./packages/search",
					include: ["./**/*.test.?(c|m)[jt]s?(x)"],
				},
			},
			// Benchmarks (Node environment, used by `vitest bench --project bench`)
			{
				test: {
					name: "bench",
					include: ["packages/**/*.bench.?(c|m)[jt]s?(x)"],
				},
			},
		],
		coverage: {
			enabled: true,
			reportOnFailure: true,
			reportsDirectory: "./.vitest-coverage",
			exclude: [
				// ビルド成果物・依存関係
				"**/.next/**/*",
				"**/node_modules/**/*",
				"**/dist/**/*",

				// 生成コード
				"app/src/generated/**/*",
				"packages/database/**/*",

				// テスト・Storybook・ベンチマーク
				"**/*.stories.tsx",
				"**/*.test.ts?(x)",
				"**/*.bench.ts",
				".storybook/**/*",

				// 型定義・インターフェース（ロジックを含まないもの）
				"**/types.ts",
				"packages/core/**/*.interface.ts",

				// 設定ファイル
				"**/vitest.config.ts",
				"**/vitest-setup.*",
				"app/next.config.mjs",
				"app/tailwind.config.ts",
				"app/postcss.config.js",
				"app/sentry.*.config.ts",
				"app/src/env.ts",

				// テスト困難なインフラ・スクリプト
				"packages/search/src/config.ts",
				"packages/storage/**/*",
				"packages/scripts/**/*",

				// Next.js App Router（ページ/レイアウト/メタデータのみ除外、API routeは含める）
				"app/src/app/[locale]/**/*",
				"app/src/app/layout.tsx",
				"app/src/app/not-found.tsx",
				"app/src/app/error.tsx",
				"app/src/app/global-error.tsx",
				"app/src/app/manifest.ts",
				"app/src/app/robots.ts",
				"app/src/app/globals.css",

				// データローダー（サーバーコンポーネント依存で単体テスト困難）
				"app/src/loaders/**/*",
			],
			reporter: ["text", "json-summary", "json"],
		},
	},
});
