import eslintMarkdown from "@eslint/markdown";
import { configs as jsoncConfigs } from "eslint-plugin-jsonc";
import { configs as ymlConfigs } from "eslint-plugin-yml";

export default [
	{
		ignores: [
			"**/node_modules/**",
			".pages/**",
			".pnpm-store/**",
			"**/.next/**",
			"**/.storybook-static/**",
			"**/.vitest-coverage/**",
			"**/dist/**",
			"docs/api/**",
			"packages/database/src/generated/**",
			"pnpm-lock.yaml",
			"security-audit.json",
		],
	},

	// YAML
	...ymlConfigs["flat/recommended"].map((config) =>
		config.rules && !config.files
			? Object.assign({}, config, { files: ["**/*.yml", "**/*.yaml"] })
			: config,
	),
	{
		files: ["**/*.yml", "**/*.yaml"],
		rules: {
			// Common in GitHub Actions (`on: push:` and similar mappings).
			"yml/no-empty-mapping-value": "off",
		},
	},

	// JSON and JSON-compatible formats
	...jsoncConfigs["flat/recommended-with-jsonc"].map((config) =>
		config.rules && !config.files
			? Object.assign({}, config, {
					files: ["**/*.json", "**/*.jsonc", "**/*.json5"],
				})
			: config,
	),
	{
		files: ["**/*.json5"],
		rules: {
			"jsonc/quote-props": "off",
		},
	},

	// Markdown
	...eslintMarkdown.configs.recommended,
	{
		files: ["**/*.md"],
		rules: {
			// GitHub admonitions and footnote references are valid project conventions.
			"markdown/no-missing-label-refs": "off",
		},
	},
];
