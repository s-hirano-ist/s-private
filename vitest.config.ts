import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vite-plus/test/config";

/**
 * Vitest Workspace Configuration
 * Integrates test suites across app and packages using test.projects
 */
export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: "application",
					include: ["packages/application/src/**/*.test.ts"],
					passWithNoTests: true,
				},
			},
			{
				test: {
					name: "infrastructure",
					include: ["packages/infrastructure/src/**/*.test.ts"],
					passWithNoTests: true,
				},
			},

			{
				test: {
					name: "backend",
					include: ["apps/backend/src/**/*.test.ts"],
				},
			},

			{
				test: {
					name: "api",
					include: [
						"packages/api-contracts/src/**/*.test.ts",
						"packages/api-client/src/**/*.test.ts",
					],
				},
			},
			{
				extends: true,
				// Prebundle browser-story dependencies before tests start to avoid Vite reloads.
				optimizeDeps: {
					include: [
						"next-intl/server",
						"next-intl/navigation",
						"next-intl/routing",
						"@base-ui/react/dialog",
					],
				},
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
				extends: "./apps/web/vitest.config.ts",
				test: {
					name: "app",
					root: "./apps/web",
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
			// Database documentation generator (pure Prisma schema transformation)
			{
				test: {
					name: "database",
					root: "./packages/database",
					include: ["./scripts/**/*.test.?(c|m)[jt]s"],
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
					include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
					env: {
						QDRANT_COLLECTION_NAME: "knowledge_v1",
						EMBEDDING_VECTOR_SIZE: "1024",
						EMBEDDING_MODEL: "intfloat/multilingual-e5-small",
					},
				},
			},
			// Shared image processing package
			{
				test: {
					name: "image-processing",
					root: "./packages/image-processing",
					include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
				},
			},
			// External batch scripts and their infrastructure clients
			{
				test: {
					name: "scripts",
					root: "./packages/scripts",
					include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
				},
			},
			// Benchmarks (Node environment, used by `pnpm bench`)
			{
				test: {
					name: "bench",
					include: [],
					benchmark: {
						enabled: true,
						include: ["packages/*/src/**/*.bench.?(c|m)[jt]s?(x)"],
					},
				},
			},
			// Component benchmarks (happy-dom environment, used by `pnpm bench:components`)
			{
				extends: "./apps/web/vitest.config.ts",
				test: {
					name: "app-bench",
					root: "./apps/web",
					include: [],
					benchmark: {
						enabled: true,
						include: ["./src/**/*.bench.?(c|m)[jt]s?(x)"],
					},
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
				"apps/web/src/generated/**/*",
				"packages/database/**/*",

				// テスト・Storybook・ベンチマーク
				"**/*.stories.tsx",
				"**/*.test.ts?(x)",
				"**/*.bench.ts",
				"**/*.bench.tsx",
				".storybook/**/*",

				// 型定義・インターフェース（ロジックを含まないもの）
				"**/types.ts",
				"packages/core/**/*.interface.ts",

				// 設定ファイル
				"**/vitest.config.ts",
				"**/vitest-setup.*",
				"apps/web/next.config.mjs",
				"apps/web/tailwind.config.ts",
				"apps/web/postcss.config.js",
				"apps/web/sentry.*.config.ts",
				"apps/web/src/env.ts",
				"apps/web/messages/**/*",

				// テスト困難なインフラ・スクリプト
				"packages/search/src/config.ts",
				"packages/storage/**/*",
				"packages/scripts/**/*",

				// Next.js App Router（ページ/レイアウト/メタデータのみ除外、API routeは含める）
				"apps/web/src/app/[locale]/**/*",
				"apps/web/src/app/layout.tsx",
				"apps/web/src/app/not-found.tsx",
				"apps/web/src/app/error.tsx",
				"apps/web/src/app/global-error.tsx",
				"apps/web/src/app/manifest.ts",
				"apps/web/src/app/robots.ts",
				"apps/web/src/app/globals.css",

				// データローダー（サーバーコンポーネント依存で単体テスト困難）
				"apps/web/src/loaders/**/*",
			],
			reporter: ["text", "json-summary", "json"],
		},
	},
});
