module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: [
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
		"plugin:mdx/recommended",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: "latest",
		project: ["./tsconfig.json"],
	},
	plugins: ["import", "react", "jsx-a11y", "unused-imports", "tailwindcss"],
	rules: {
		"@typescript-eslint/no-misused-promises": [
			2,
			{
				checksVoidReturn: { attributes: false },
			},
		],
		"react-hooks/rules-of-hooks": "off",
		"react-hooks/exhaustive-deps": "warn",
		"react/react-in-jsx-scope": "off",
		"react/prop-types": "off",
		"@next/next/no-img-element": "off",
		"no-console": ["warn", { allow: ["error"] }],
		"no-restricted-imports": ["error", { patterns: ["../"] }], // TODO: src/apis/prisma/**/* 配下の全ファイルに対して、**/actions/**/* あるいは、**/page.tsx からしか読み込めないようにする
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^_",
				caughtErrorsIgnorePattern: "^_",
			},
		],
		"@typescript-eslint/consistent-type-definitions": ["error", "type"],
		"@typescript-eslint/require-await": "off", // Conflict with import "server-only";
		// FIXME:
		"@typescript-eslint/no-unsafe-call": "off",
		"@typescript-eslint/no-unsafe-assignment": "off",
		"@typescript-eslint/no-unsafe-member-access": "off",
	},
	root: true,
	settings: {
		"import/resolver": {
			node: {
				extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
				moduleDirectory: ["node_modules", "src/"],
			},
		},
	},
};
