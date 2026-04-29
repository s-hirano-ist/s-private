// MEMO: only use for plugins not in biome

import vitestPlugin from "@vitest/eslint-plugin";
import { defineConfig } from "eslint/config";
import nextConfig from "eslint-config-next";
import boundariesPlugin from "eslint-plugin-boundaries";
import reactPlugin from "eslint-plugin-react";
import reactHookPlugin from "eslint-plugin-react-hooks";
// import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import storybookPlugin from "eslint-plugin-storybook";
// import tailwindcssPlugin from "eslint-plugin-tailwindcss";
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
	...tsEslint.configs.strict,
	...nextConfig,
	// eslint-config-next bundles an outdated babel-eslint-parser whose ScopeManager
	// lacks `addGlobals` (required by ESLint v10). Override it back to typescript-eslint's
	// parser for non-TS files so scope analysis stays compatible.
	{
		files: ["**/*.{js,jsx,mjs,cjs}"],
		languageOptions: {
			parser: tsEslint.parser,
		},
	},
	reactPlugin.configs.flat.recommended,
	reactPlugin.configs.flat["jsx-runtime"],
	{
		languageOptions: {
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
		settings: { react: { version: "19.2" } },
		rules: {
			// React rules (Biome doesn't have these)
			"react/destructuring-assignment": "error",
			"react/function-component-definition": ["error", {}],
			"react/hook-use-state": "error",
			"react/jsx-boolean-value": "error",
			"react/jsx-fragments": "error",
			"react/jsx-curly-brace-presence": "error",
			"react/jsx-sort-props": "error",
			"react/jsx-pascal-case": "error",
			"react/no-danger": "error",
			"react/prop-types": "off",

			// Disable rules that conflict with Biome
			// Biome handles: self-closing elements, unused vars, any type
			"react/self-closing-comp": "off", // Biome: useSelfClosingElements
			"@typescript-eslint/no-unused-vars": "off", // Biome handles this
			"@typescript-eslint/no-empty-object-type": "off", // Biome: noBannedTypes
			"@typescript-eslint/no-explicit-any": "off", // Biome: noExplicitAny
		},
	},

	// react-hooks (includes React Compiler rules via recommended-latest)
	reactHookPlugin.configs.flat["recommended-latest"],
	{
		rules: {
			"react-hooks/exhaustive-deps": "error",
			"react-hooks/rules-of-hooks": "error",
			// TODO: Fix components to avoid calling setState directly in useEffect
			// Affected files: footer.tsx, root-tab.tsx, use-tab-visibility.ts, generic-form-wrapper.tsx, use-infinite-scroll.ts
			"react-hooks/set-state-in-effect": "off",
		},
	},

	// vitest
	vitestPlugin.configs.recommended,
	{
		rules: {
			"vitest/consistent-test-it": ["error", { fn: "test" }],
		},
	},

	// storybook
	...storybookPlugin.configs["flat/recommended"],

	// eslint-plugin-boundaries: Clean Architectureレイヤー境界をIDEで即時検出
	// dependency-cruiserと役割分担: こちらはwarnで開発体験補完、CIはdependency-cruiser
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
				"warn",
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

	// TODO: enable when biome conflicts occur
	// {
	// 	files: ["**/*"],
	// 	ignores: ["**/*"],
	// },
);
