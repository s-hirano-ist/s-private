import { FlatCompat } from "@eslint/eslintrc";
import vitestPlugin from "@vitest/eslint-plugin";
import boundariesPlugin from "eslint-plugin-boundaries";
// import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHookPlugin from "eslint-plugin-react-hooks";
// import storybookPlugin from "eslint-plugin-storybook";
// import tailwindcssPlugin from "eslint-plugin-tailwindcss";
import globals from "globals";
import tsEslint from "typescript-eslint";

const compat = new FlatCompat({
	baseDirectory: import.meta.dirname,
});

export default tsEslint.config(
	{
		ignores: [
			"src/generated/**/*",
			"node_modules/**/*", // Ignore build outputs and dependencies
			".next/**/*",
			".storybook-static/**/*", // Ignore Storybook build output
			".vitest-coverage/**/*", // Ignore coverage reports
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
		languageOptions: {
			globals: globals.browser,
		},
	},
	tsEslint.configs.strict,
	reactPlugin.configs.flat.recommended,
	reactPlugin.configs.flat["jsx-runtime"], // https://github.com/jsx-eslint/eslint-plugin-react?tab=readme-ov-file#flat-configs
	// jsx-a11y is included in Next.js config, so we avoid duplicate registration
	vitestPlugin.configs.recommended,
	...compat.extends("plugin:react-hooks/recommended"),
	// FIXME: not working with eslint inspector
	...compat.extends("next"),
	// Base configuration for all files

	// FIXME: not working
	// ...tailwindcssPlugin.configs["flat/recommended"],
	{
		settings: {
			react: {
				version: "detect",
			},
		},
		rules: {
			"react/destructuring-assignment": "error", // Props などの分割代入を強制
			// "react/function-component-definition": [
			// 	"error",
			// 	{
			// 		// namedComponents: "function-expression",
			// 		// unnamedComponents: "function-expression",
			// 	},
			// ],
			"react/hook-use-state": "error", // useState の返り値の命名を [value, setValue] に統一
			"react/jsx-boolean-value": "error", // boolean 型の Props の渡し方を統一
			"react/jsx-fragments": "error", // React Fragment の書き方を統一
			"react/jsx-curly-brace-presence": "error", // Props と children で不要な中括弧を削除
			// "react/jsx-no-useless-fragment": "error", // 不要な React Fragment を削除
			"react/jsx-sort-props": "error", // Props の並び順をアルファベット順に統一
			"react/self-closing-comp": "error", // 子要素がない場合は自己終了タグを使う
			"react/jsx-pascal-case": "error", // コンポーネント名をパスカルケースに統一
			"react/no-danger": "error", // dangerouslySetInnerHTML を許可しない
			"react/prop-types": "off", // Props の型チェックは TS で行う & 誤検知があるため無効化
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-empty-object-type": "off",
		},
	},
	{
		rules: {
			"no-console": ["warn", { allow: ["error"] }],
		},
	},

	{
		rules: {
			// Prevent relative imports that go up directories to enforce proper architecture
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							group: ["../../../*", "../../../../*", "../../../../../**/*"],
							message:
								"Use absolute imports instead of relative imports that go up directories. This enforces proper architecture boundaries.",
						},
					],
				},
			],
		},
	},

	{
		rules: {
			"@typescript-eslint/consistent-type-definitions": ["error", "type"],
		},
	},
	{
		// eslint-plugin-react-hooks の設定
		plugins: { "react-hooks": reactHookPlugin },
		rules: {
			"react-hooks/exhaustive-deps": "error", // recommended では warn のため error に上書き
			"react-hooks/rules-of-hooks": "error",
		},
	},
	{
		// @vitest/eslint-plugin の設定
		rules: {
			"vitest/consistent-test-it": ["error", { fn: "test" }], // it ではなく test に統一
		},
	},
	// ...storybookPlugin.configs["flat/recommended"],

	// Boundaries plugin configuration for strict dependencies
	{
		plugins: { boundaries: boundariesPlugin },

		// チェック対象は features 配下のみ（テストは除外）
		files: ["src/features/**/*"],
		ignores: ["src/features/**/*.test.ts?(x)"],

		settings: {
			"boundaries/elements": [
				{
					type: "feature",
					pattern: "src/features/*/**", // features/<feature>/以下（深さは任意）
					mode: "full",
					capture: ["feature"], // <feature> 部分を保存
				},
				// もし features/<feature> 直下のファイルもあり得るなら追加
				{
					type: "feature",
					pattern: "src/features/*/*",
					mode: "full",
					capture: ["feature"],
				},
			],
		},

		rules: {
			// デフォルトは「別 feature への import は禁止」
			"boundaries/element-types": [
				"error",
				{
					default: "disallow",
					rules: [
						{
							// 自分と同じ feature への import だけ許可
							from: "feature",
							allow: [["feature", { feature: "${from.feature}" }]],
						},
					],
					message:
						"features間のimportは禁止。同一feature内のみimport可能です。",
				},
			],
		},
	},
);
