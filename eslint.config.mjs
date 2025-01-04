import path from "node:path";
import { fileURLToPath } from "node:url";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import markdown from "@eslint/markdown";
import tsParser from "@typescript-eslint/parser";
import _import from "eslint-plugin-import";
// import jsxA11Y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import tailwindcss from "eslint-plugin-tailwindcss";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default [
	{ ignores: ["**/*.test.*"] },
	...markdown.configs.recommended, // FIXME: not working
	...fixupConfigRules(
		compat.extends(
			"next/core-web-vitals",
			"eslint:recommended",
			"next",
			"plugin:tailwindcss/recommended",
			"plugin:@typescript-eslint/recommended-type-checked",
			"plugin:@typescript-eslint/stylistic-type-checked",
			"plugin:react/recommended",
			"plugin:react-hooks/recommended",
			"plugin:@next/next/recommended",
			"plugin:import/recommended",
			"plugin:import/typescript",
		),
	),
	{
		plugins: {
			import: fixupPluginRules(_import),
			react: fixupPluginRules(react),
			// "jsx-a11y": jsxA11Y,
			"unused-imports": unusedImports,
			tailwindcss: fixupPluginRules(tailwindcss),
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

		rules: {
			"@typescript-eslint/no-misused-promises": [
				2,
				{ checksVoidReturn: { attributes: false } },
			],

			"react-hooks/exhaustive-deps": "warn",
			"react/react-in-jsx-scope": "off",
			"react/prop-types": "off",

			"no-console": ["warn", { allow: ["error"] }],

			"no-restricted-imports": ["error", { patterns: ["../"] }],

			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],

			"@typescript-eslint/consistent-type-definitions": ["error", "type"],
			"@typescript-eslint/require-await": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
		},
	},
];
