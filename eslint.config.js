import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import markdown from "@eslint/markdown";
import vitestPlugin from "@vitest/eslint-plugin";
// import importPlugin from "eslint-plugin-import";
import perfectionistPlugin from "eslint-plugin-perfectionist";
// import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHookPlugin from "eslint-plugin-react-hooks";
import spellcheckPlugin from "eslint-plugin-spellcheck";
import storybookPlugin from "eslint-plugin-storybook";
import tailwindcssPlugin from "eslint-plugin-tailwindcss";
import unicornPlugin from "eslint-plugin-unicorn";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import globals from "globals";
import tsEslint from "typescript-eslint";

const compat = new FlatCompat({
	baseDirectory: import.meta.dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default tsEslint.config(
	{
		languageOptions: {
			globals: globals.browser,
		},
	},
	js.configs.recommended,
	tsEslint.configs.strict,
	reactPlugin.configs.flat.recommended,
	reactPlugin.configs.flat["jsx-runtime"], // https://github.com/jsx-eslint/eslint-plugin-react?tab=readme-ov-file#flat-configs
	// jsxA11yPlugin.flatConfigs.recommended,
	vitestPlugin.configs.recommended,
	...markdown.configs.recommended,
	...compat.extends("plugin:react-hooks/recommended"),
	...compat.extends("next"),
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
		},
	},
	{
		rules: {
			"no-console": ["warn", { allow: ["error"] }],
		},
	},

	{
		rules: {
			"no-restricted-imports": ["error", { patterns: ["../"] }],
		},
	},
	{
		// eslint-plugin-unused-imports の設定
		plugins: { "unused-imports": unusedImportsPlugin },
		rules: {
			"@typescript-eslint/no-unused-vars": "off", // 重複エラーを防ぐため typescript-eslint の方を無効化
			"unused-imports/no-unused-imports": "error",
			"unused-imports/no-unused-vars": [
				"error",
				{
					vars: "all",
					varsIgnorePattern: "^_",
					args: "after-used",
					argsIgnorePattern: "^_",
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
	{
		// eslint-plugin-spellcheck の設定
		plugins: { spellcheck: spellcheckPlugin },
		rules: {
			"spellcheck/spell-checker": [
				"error",
				{
					minLength: 5, // 5 文字以上の単語をチェック
					// チェックをスキップする単語の配列
					skipWords: [
						"prisma",
						"minio",
						"favicon",
						"pathname",
						"sitemap",
						"matcher",
						"webmanifest",
						"nodejs",
						"rehype",
						"shiki",
						"vitesse",
						"mdast",
						"nofollow",
						"uint",
						"charset",
						"unexported",
						"autodocs",
						"whitespace",
						"nullable",
						"dropdown",
						"textarea",
						"revalidate",
						"upsert",
						"uuidv7",
						"resize",
						"namespace",
						"nowrap",
						"sonner",
						"radix",
						"checkbox",
						"semibold",
						"debounced",
						"shadcn",
						"photoswipe",
						"lightbox",
						"noreferrer",
						"signout",
						"extrabold",
						"comming",
						"hirano",
						"latin",
						"readonly",
						"ist",
						"dismissible",
						"devtools",
						"biome",
						"vitest",
						"compat",
						"tailwindcss",
						"globals",
						"integrations",
						"Vercel",
					],
				},
			],
		},
	},
	{
		// eslint-plugin-perfectionist の設定
		plugins: { perfectionist: perfectionistPlugin },
		rules: {
			"perfectionist/sort-interfaces": "warn", // interface のプロパティの並び順をアルファベット順に統一
			"perfectionist/sort-object-types": "warn", // Object 型のプロパティの並び順をアルファベット順に統一
		},
	},
	...storybookPlugin.configs["flat/recommended"],
	unicornPlugin.configs["recommended"],
	{
		rules: {
			"unicorn/prevent-abbreviations": "off",
			"unicorn/no-await-expression-member": "off",
			"unicorn/no-null": "off",
			"unicorn/prefer-code-point": "off",
			"unicorn/no-abusive-eslint-disable": "off",
			"unicorn/prefer-global-this": "off",
			"unicorn/consistent-function-scoping": "off",
			"unicorn/no-new-array": "off",
			"unicorn/no-useless-spread": "off",
		},
	},
	...tailwindcssPlugin.configs["flat/recommended"],

	// NO USE BECAUSE BIOME DOES THE SAME THING
	// {
	// 	// eslint-plugin-import の設定
	// 	plugins: { import: importPlugin },
	// 	rules: {
	// 		"import/order": [
	// 			// import の並び順を設定
	// 			"warn",
	// 			{
	// 				groups: [
	// 					"builtin",
	// 					"external",
	// 					"internal",
	// 					["parent", "sibling"],
	// 					"object",
	// 					"type",
	// 					"index",
	// 				],
	// 				"newlines-between": "always",
	// 				pathGroupsExcludedImportTypes: ["builtin"],
	// 				alphabetize: { order: "asc", caseInsensitive: true },
	// 				pathGroups: [
	// 					{
	// 						pattern: "react",
	// 						group: "external",
	// 						position: "before",
	// 					},
	// 				],
	// 			},
	// 		],
	// 	},
	// },
);
