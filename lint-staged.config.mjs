export default {
	"*.{js,jsx,mjs,cjs,ts,tsx}": [
		"oxfmt",
		"oxlint --fix --no-error-on-unmatched-pattern",
	],
	"*.css": ["oxfmt", "stylelint --fix"],
	"*.md": "mise exec -- rumdl check --fix",
	"*": () => "pnpm lint:secret",
};
