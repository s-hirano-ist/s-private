// MEMO: only use for plugins not in biome

import eslintReact from "@eslint-react/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import vitestPlugin from "@vitest/eslint-plugin";
import { defineConfig } from "eslint/config";
import boundariesPlugin from "eslint-plugin-boundaries";
// import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import reactHookPlugin from "eslint-plugin-react-hooks";
import regexpPlugin from "eslint-plugin-regexp";
import storybookPlugin from "eslint-plugin-storybook";
// import tailwindcssPlugin from "eslint-plugin-tailwindcss";
import globals from "globals";
import tsEslint from "typescript-eslint";

export default defineConfig(
	{
		ignores: [
			"packages/database/src/generated/**/*",
			"**/node_modules/**/*",
			"**/.next/**/*",
			"**/.storybook-static/**/*",
			"**/.vitest-coverage/**/*",
			"**/dist/**/*",
			"**/next-env.d.ts", // Next.js auto-generated file
			"docs/**/*", // TypeDoc generated files
			"memlab/**/*", // memlab scenarios (standalone scripts)
			"e2e/**/*", // Playwright e2e tests (standalone)
		],
	},
	{
		files: [
			"**/*.js",
			"**/*.jsx",
			"**/*.ts",
			"**/*.tsx",
			"**/*.mjs",
			"**/*.cjs",
		],
	},

	// typescript-eslint: 全 TS ファイルでパーサを登録（base のみ）
	{
		files: ["**/*.{ts,tsx,mts,cts}"],
		extends: [tsEslint.configs.base],
	},

	// typescript-eslint: type-checked variants for the strictest possible setup.
	// Restrict to source dirs so config files (.dependency-cruiser.cjs, etc.)
	// don't trigger type-aware rules without parserServices.
	{
		files: ["app/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
		extends: [
			tsEslint.configs.strictTypeChecked,
			tsEslint.configs.stylisticTypeChecked,
		],
	},

	// Next.js: register @next/eslint-plugin-next directly to avoid the
	// "next/typescript" config redefining @typescript-eslint plugin (the previous
	// `eslint-config-next` index caused a fatal ConfigError under ESLint v10).
	{
		name: "next/core-web-vitals",
		plugins: { "@next/next": nextPlugin },
		rules: {
			...nextPlugin.configs.recommended.rules,
			...nextPlugin.configs["core-web-vitals"].rules,
		},
	},

	// @eslint-react: type-checked rules + プロジェクト固有の調整。
	// plugin 定義と rules を同一ブロックに置く必要があるため extends 内で完結させる。
	{
		files: ["app/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
		extends: [eslintReact.configs["strict-type-checked"]],
		rules: {
			// @eslint-react rules (Biome doesn't have these)
			"@eslint-react/use-state": "error",
			"@eslint-react/jsx-no-useless-fragment": "error",
			"@eslint-react/dom-no-dangerously-set-innerhtml": "error",

			// Hooks lint は eslint-plugin-react-hooks (React 公式 + React Compiler 連携) に委譲
			"@eslint-react/exhaustive-deps": "off",
			"@eslint-react/rules-of-hooks": "off",
		},
	},

	// typescript-eslint パーサ設定 + ルール調整
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						".storybook/*.ts",
						".storybook/*.tsx",
						"*.config.ts",
						"*.config.js",
						"*.config.mjs",
						"*.cjs",
						"app/*.config.js",
						"app/*.config.mjs",
					],
					maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 12,
				},
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		files: ["app/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
		rules: {
			// Biome 委譲（既存の方針維持）
			"@typescript-eslint/no-unused-vars": "off", // Biome handles this
			"@typescript-eslint/no-empty-object-type": "off", // Biome: noBannedTypes
			"@typescript-eslint/no-explicit-any": "off", // Biome: noExplicitAny

			// type-checked 拡張で実コードと整合させるための調整
			"@typescript-eslint/no-misused-promises": [
				"error",
				{ checksVoidReturn: { attributes: false } },
			],
			"@typescript-eslint/restrict-template-expressions": [
				"error",
				{ allowNumber: true, allowBoolean: true, allowNullish: true },
			],
			"@typescript-eslint/no-confusing-void-expression": [
				"error",
				{ ignoreArrowShorthand: true, ignoreVoidOperator: true },
			],

			// Next.js の Page / Server Component / Server Action は規約上 async 必須で、
			// body に await が無いケースが多発するため off。
			"@typescript-eslint/require-await": "off",

			// プリミティブ型では empty string / 0 fallthrough が意図的なケースも多く、
			// `??` への一律変換は意味が変わる。プリミティブのみ `||` を許容。
			"@typescript-eslint/prefer-nullish-coalescing": [
				"error",
				{
					ignorePrimitives: {
						string: true,
						number: true,
						boolean: true,
						bigint: true,
					},
				},
			],

			// 段階導入: 既存コードに広範な該当が予想されるため warn でスタート
			"@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/no-unsafe-member-access": "warn",
			"@typescript-eslint/no-unsafe-argument": "warn",
			"@typescript-eslint/no-unsafe-call": "warn",
			"@typescript-eslint/no-unsafe-return": "warn",
			"@typescript-eslint/no-non-null-assertion": "warn",
			"@typescript-eslint/no-unnecessary-condition": "warn",
			"@typescript-eslint/no-base-to-string": "warn",
			"@typescript-eslint/no-deprecated": "warn",

			// type/interface 混在許容（プロジェクト方針）
			"@typescript-eslint/consistent-type-definitions": "off",
			"@typescript-eslint/consistent-indexed-object-style": "off",
			"@typescript-eslint/consistent-type-assertions": "off",
		},
	},

	// react-hooks (includes React Compiler rules via recommended-latest)
	reactHookPlugin.configs.flat["recommended-latest"],
	{
		rules: {
			"react-hooks/exhaustive-deps": "error",
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/set-state-in-effect": "error",
		},
	},

	// vitest
	vitestPlugin.configs.recommended,
	{
		rules: {
			"vitest/consistent-test-it": ["error", { fn: "test" }],
		},
	},

	// テストファイル/Storybook: mock パターンと play 関数で多発する false-positive を緩和
	{
		files: [
			"**/*.{test,spec}.{ts,tsx}",
			"**/__tests__/**/*.{ts,tsx}",
			"**/*.stories.{ts,tsx}",
			"**/vitest-setup.tsx",
			"**/vitest.setup.ts",
		],
		rules: {
			"@typescript-eslint/unbound-method": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-confusing-void-expression": "off",
			"@typescript-eslint/require-await": "off",
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/no-floating-promises": "off",
		},
	},

	// storybook
	...storybookPlugin.configs["flat/recommended"],

	// regexp: 正規表現ベストプラクティスとバグ検出（Biome に該当ルールなし）
	regexpPlugin.configs["flat/recommended"],

	// eslint-plugin-boundaries: Clean Architectureレイヤー境界をIDEで即時検出
	// dependency-cruiserと役割分担: こちらはerrorで即時違反を防ぎ、CIはdependency-cruiser
	{
		files: ["app/src/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
		ignores: [
			"**/*.stories.{ts,tsx}",
			"**/*.{test,spec}.{ts,tsx}",
			"**/vitest.config.ts",
			"**/vitest-setup.tsx",
			"**/*.d.ts",
			"packages/database/src/generated/**/*",
		],
		plugins: { boundaries: boundariesPlugin },
		settings: {
			"import/resolver": {
				typescript: {
					alwaysTryTypes: true,
					project: ["./tsconfig.json", "./packages/*/tsconfig.json"],
				},
				node: true,
			},
			"boundaries/include": ["app/src/**/*", "packages/**/*"],
			"boundaries/ignore": [
				"**/*.stories.{ts,tsx}",
				"**/*.{test,spec}.{ts,tsx}",
				"**/*.d.ts",
				"packages/database/src/generated/**/*",
			],
			// 順序重要: shared-kernelをcore-domainの前、infrastructure(domain付き)をsharedより前に
			"boundaries/elements": [
				{
					type: "core-shared-kernel",
					pattern: "packages/core/shared-kernel/**/*",
					mode: "file",
				},
				{
					type: "core-domain",
					pattern: "packages/core/:domain/**/*",
					mode: "file",
					capture: ["domain"],
				},
				{
					type: "app-application-service",
					pattern: "app/src/application-services/:domain/**/*",
					mode: "file",
					capture: ["domain"],
				},
				{
					type: "app-application-service-common",
					pattern: "app/src/application-services/common/**/*",
					mode: "file",
				},
				{
					type: "app-infrastructure",
					pattern: "app/src/infrastructures/:domain/**/*",
					mode: "file",
					capture: ["domain"],
				},
				{
					type: "app-infrastructure-shared",
					pattern:
						"app/src/infrastructures/!(articles|books|notes|images|search)/**/*",
					mode: "file",
				},
				{ type: "app-loader", pattern: "app/src/loaders/**/*", mode: "file" },
				{
					type: "app-component",
					pattern: "app/src/components/**/*",
					mode: "file",
				},
				{ type: "app-route", pattern: "app/src/app/**/*", mode: "file" },
				{ type: "app-common", pattern: "app/src/common/**/*", mode: "file" },
				{ type: "pkg-ui", pattern: "packages/ui/**/*", mode: "file" },
				{
					type: "pkg-database",
					pattern: "packages/database/**/*",
					mode: "file",
				},
				{
					type: "pkg-notification",
					pattern: "packages/notification/**/*",
					mode: "file",
				},
				{ type: "pkg-search", pattern: "packages/search/**/*", mode: "file" },
				{ type: "pkg-storage", pattern: "packages/storage/**/*", mode: "file" },
			],
		},
		rules: {
			"boundaries/dependencies": [
				"error",
				{
					default: "disallow",
					rules: [
						{
							from: { type: "core-shared-kernel" },
							allow: { to: { type: "core-shared-kernel" } },
						},
						{
							from: { type: "core-domain" },
							allow: [
								{ to: { type: "core-shared-kernel" } },
								{
									to: {
										type: "core-domain",
										captured: { domain: "{{from.domain}}" },
									},
								},
							],
						},
						{
							from: { type: "app-application-service" },
							allow: [
								{
									to: {
										type: [
											"core-shared-kernel",
											"app-application-service-common",
											"app-infrastructure",
											"app-infrastructure-shared",
											"app-common",
										],
									},
								},
								{
									to: {
										type: "core-domain",
										captured: { domain: "{{from.domain}}" },
									},
								},
								{
									to: {
										type: "app-application-service",
										captured: { domain: "{{from.domain}}" },
									},
								},
							],
						},
						{
							from: { type: "app-application-service-common" },
							allow: {
								to: {
									type: [
										"core-shared-kernel",
										"core-domain",
										"app-application-service-common",
										"app-infrastructure",
										"app-infrastructure-shared",
										"app-common",
									],
								},
							},
						},
						{
							from: { type: "app-infrastructure" },
							allow: [
								{
									to: {
										type: [
											"core-shared-kernel",
											"app-infrastructure",
											"app-infrastructure-shared",
											"app-common",
											"pkg-database",
											"pkg-search",
											"pkg-storage",
											"pkg-notification",
										],
									},
								},
								{
									to: {
										type: "core-domain",
										captured: { domain: "{{from.domain}}" },
									},
								},
							],
						},
						{
							from: { type: "app-infrastructure-shared" },
							allow: {
								to: {
									type: [
										"core-shared-kernel",
										"core-domain",
										"app-infrastructure",
										"app-infrastructure-shared",
										"app-common",
										"pkg-database",
										"pkg-search",
										"pkg-storage",
										"pkg-notification",
									],
								},
							},
						},
						{
							from: { type: "app-loader" },
							allow: {
								to: {
									type: [
										"core-shared-kernel",
										"core-domain",
										"app-application-service",
										"app-application-service-common",
										"app-loader",
										"app-component",
										"app-common",
										"app-infrastructure-shared",
									],
								},
							},
						},
						{
							from: { type: "app-component" },
							allow: {
								to: {
									type: [
										"core-shared-kernel",
										"app-application-service",
										"app-application-service-common",
										"app-loader",
										"app-component",
										"app-common",
										"app-infrastructure-shared",
										"pkg-ui",
									],
								},
							},
						},
						{
							from: { type: "app-route" },
							allow: {
								to: {
									type: [
										"core-shared-kernel",
										"app-application-service",
										"app-application-service-common",
										"app-infrastructure",
										"app-infrastructure-shared",
										"app-loader",
										"app-component",
										"app-common",
										"app-route",
										"pkg-ui",
									],
								},
							},
						},
						{
							from: { type: "app-common" },
							allow: {
								to: {
									type: [
										"core-shared-kernel",
										"app-common",
										"app-infrastructure-shared",
										// error-wrapper はエラー型の instanceof 判定で
										// 各 infrastructure パッケージの error 型を直接参照する。
										"pkg-database",
										"pkg-notification",
										"pkg-storage",
									],
								},
							},
						},
						{
							from: { type: "pkg-ui" },
							allow: { to: { type: "pkg-ui" } },
						},
						{
							from: { type: "pkg-database" },
							allow: { to: { type: "pkg-database" } },
						},
						{
							from: { type: "pkg-notification" },
							allow: { to: { type: "pkg-notification" } },
						},
						{
							from: { type: "pkg-search" },
							allow: { to: { type: ["pkg-search", "pkg-database"] } },
						},
						{
							from: { type: "pkg-storage" },
							allow: { to: { type: "pkg-storage" } },
						},
					],
				},
			],
			"boundaries/no-unknown": "off",
			"boundaries/no-unknown-files": "off",
			"boundaries/entry-point": "off",
		},
	},
);
