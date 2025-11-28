// MEMO: only use for plugins not in biome

import { FlatCompat } from "@eslint/eslintrc";
import vitestPlugin from "@vitest/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHookPlugin from "eslint-plugin-react-hooks";
// import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import storybookPlugin from "eslint-plugin-storybook";
// import tailwindcssPlugin from "eslint-plugin-tailwindcss";
import tsEslint from "typescript-eslint";

// FIXME: not workking

const compat = new FlatCompat({
	baseDirectory: import.meta.dirname,
});

export default tsEslint.config(
	{
		ignores: [
			"packages/database/src/generated/**/*",
			"**/node_modules/**/*",
			"**/.next/**/*",
			"**/.storybook-static/**/*",
			"**/.vitest-coverage/**/*",
			"**/dist/**/*",
			"**/next-env.d.ts", // Next.js auto-generated file
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
	reactPlugin.configs.flat.recommended,
	reactPlugin.configs.flat["jsx-runtime"],
	...compat.extends("plugin:react-hooks/recommended"),
	...compat.extends("next"),

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
					],
				},
				tsconfigRootDir: import.meta.dirname,
			},
		},
		settings: { react: { version: "detect" } },
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
