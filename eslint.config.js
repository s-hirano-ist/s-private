import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import markdown from "@eslint/markdown";
import tsParser from "@typescript-eslint/parser";
import _import from "eslint-plugin-import";
// import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHookEslint from "eslint-plugin-react-hooks";
import storybookEslint from "eslint-plugin-storybook";
import tailwindcss from "eslint-plugin-tailwindcss";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tsEslint from "typescript-eslint";
const compat = new FlatCompat({
	baseDirectory: import.meta.dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default tsEslint.config(
	js.configs.recommended,
	// jsxA11y.flatConfigs.recommended,
	tsEslint.configs.recommended,
	react.configs.flat.recommended,
	...markdown.configs.recommended,
	...compat.config({ extends: ["next"] }),

	{
		plugins: {
			"unused-imports": unusedImports,
		},

		languageOptions: {
			globals: {
				...globals.browser,
			},

			parser: tsParser,
			ecmaVersion: "latest",
			sourceType: "script",

			parserOptions: {
				project: ["./tsconfig.json"],
			},
		},

		settings: {
			"import/resolver": {
				node: {
					extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
					moduleDirectory: ["node_modules", "src/"],
				},
			},
		},
	},
	{
		rules: { "react/prop-types": "off" },
	},
	react.configs.flat["jsx-runtime"], // https://github.com/jsx-eslint/eslint-plugin-react?tab=readme-ov-file#flat-configs
	{
		plugins: { "react-hooks": reactHookEslint },
		rules: {
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",
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
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
		},
	},

	{
		rules: {
			"@typescript-eslint/consistent-type-definitions": ["error", "type"],
		},
	},
	...storybookEslint.configs["flat/recommended"],
	...tailwindcss.configs["flat/recommended"],
);
