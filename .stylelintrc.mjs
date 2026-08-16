export default {
	extends: ["stylelint-config-standard"],
	plugins: [
		"stylelint-declaration-block-no-ignored-properties",
		"stylelint-no-unsupported-browser-features",
		"stylelint-order",
	],
	rules: {
		"order/properties-order": ["width", "height"],
		"plugin/declaration-block-no-ignored-properties": true,
		"plugin/no-unsupported-browser-features": [
			true,
			{
				browsers: [
					"last 2 Chrome versions",
					"last 2 Safari versions",
					"last 2 Firefox versions",
				],
				ignorePartialSupport: true,
			},
		],
		"at-rule-no-unknown": [
			true,
			{
				ignoreAtRules: [
					"tailwind",
					"layer",
					"apply",
					"plugin",
					"source",
					"theme",
					"custom-variant",
					"utility",
					"variant",
					"reference",
					"config",
				],
			},
		],
		"function-no-unknown": [
			true,
			{ ignoreFunctions: ["theme", "screen", "--alpha", "--spacing"] },
		],
		"declaration-property-value-no-unknown": [
			true,
			{ ignoreProperties: { "/.+/": ["/^--(spacing|alpha)\\("] } },
		],
		"import-notation": "string",
		"alpha-value-notation": "number",
		"property-no-vendor-prefix": [
			true,
			{ ignoreProperties: ["-webkit-background-clip"] },
		],
	},
};
