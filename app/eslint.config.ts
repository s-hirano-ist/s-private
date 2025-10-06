// MEMO: only use for plugins not in biome

import { FlatCompat } from "@eslint/eslintrc";
import vitestPlugin from "@vitest/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHookPlugin from "eslint-plugin-react-hooks";
// import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import storybookPlugin from "eslint-plugin-storybook";
// import tailwindcssPlugin from "eslint-plugin-tailwindcss";
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
	},
	tsEslint.configs.strict,
	reactPlugin.configs.flat.recommended,
	reactPlugin.configs.flat["jsx-runtime"], // https://github.com/jsx-eslint/eslint-plugin-react?tab=readme-ov-file#flat-configs
	// jsx-a11y is included in Next.js config, so we avoid duplicate registration
	...compat.extends("plugin:react-hooks/recommended"),
	// FIXME: not working with eslint inspector
	...compat.extends("next"),

	// FIXME: not working
	// ...tailwindcssPlugin.configs["flat/recommended"],
	{
		settings: { react: { version: "detect" } },
		rules: {
			"react/destructuring-assignment": "error", // Props などの分割代入を強制
			"react/function-component-definition": [
				"error",
				{
					// namedComponents: "function-expression",
					// unnamedComponents: "function-expression",
				},
			],
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
			"@typescript-eslint/no-explicit-any": "off",
		},
	},

	// react-hooks
	{
		plugins: { "react-hooks": reactHookPlugin },
		rules: {
			"react-hooks/exhaustive-deps": "error",
			"react-hooks/rules-of-hooks": "error",
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

	// TODO: enable when biome conflicts occur
	// {
	// 	files: ["**/*"],
	// 	ignores: ["**/*"],
	// },
);
