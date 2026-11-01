export default {
	"*.{js,jsx,mjs,cjs,ts,tsx}": [
		"oxlint --fix --no-error-on-unmatched-pattern",
		"oxfmt",
	],
	"*.css": ["oxfmt", "stylelint --fix"],
	"*.md": "mise exec -- rumdl check --fix",
	"*": () => "pnpm lint:secret",
};
