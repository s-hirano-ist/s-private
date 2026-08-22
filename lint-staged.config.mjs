export default {
	"*.{js,jsx,mjs,cjs,ts,tsx}": ["oxfmt", "oxlint --fix"],
	"*.css": ["oxfmt", "stylelint --fix"],
	"*.md": "mise exec -- rumdl check --fix",
	"*": () => "pnpm lint:secret",
};
