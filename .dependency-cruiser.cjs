/** @type {import('dependency-cruiser').IConfiguration} */
const EXCLUDE_PATHS = [
	// Common infrastructure that can be imported from anywhere
	// "app/src/env\\.ts",
	// "app/src/prisma\\.ts",
	// "app/src/minio\\.ts",
	// "app/src/common/error",
	"app/sentry.edge.config.ts",
	"app/sentry.server.config.ts",
	".pnpm",
	// Prisma generated WASM files
	"app/src/generated/.*\\.wasm",
	"app/src/generated/wasm-.*-loader\\.mjs",
	"app/src/env.ts",
];

const COLLAPSE_PATTERN =
	"app/src/app|app/src/common/error|app/src/common/utils|app/src/common/auth|app/src/generated|app/src/components/common|app/src/components/notes|app/src/components/books|app/src/components/articles|app/src/components/images|app/src/infrastructures/observability|app/src/infrastructures/i18n|app/src/infrastructures/auth|app/src/infrastructures/books|app/src/infrastructures/articles|app/src/infrastructures/events|app/src/infrastructures/notes|app/src/infrastructures/images|packages/components|packages/domains/books|packages/domains/articles|packages/domains/images|packages/domains/notes|packages/domains/common|packages/domains/errors|node_modules/(?:@[^/]+/[^/]+|[^/]+)";

module.exports = {
	forbidden: [
		{
			name: "no-circular",
			severity: "warn",
			comment:
				"This dependency is part of a circular relationship. You might want to revise " +
				"your solution (i.e. use dependency inversion, make sure the modules have a single responsibility) ",
			from: {},
			to: { circular: true },
		},
		{
			name: "no-orphans",
			comment:
				"This is an orphan module - it's likely not used (anymore?). Either use it or " +
				"remove it. If it's logical this module is an orphan (i.e. it's a config file), " +
				"add an exception for it in your dependency-cruiser configuration. By default " +
				"this rule does not scrutinize dot-files (e.g. .eslintrc.js), TypeScript declaration " +
				"files (.d.ts), tsconfig.json and some of the babel and webpack configs.",
			severity: "warn",
			from: {
				orphan: true,
				pathNot: [
					"(^|/)[.][^/]+[.](?:js|cjs|mjs|ts|cts|mts|json)$", // dot files
					"[.]d[.]ts$", // TypeScript declaration files
					"(^|/)tsconfig[.]json$", // TypeScript config
					"(^|/)(?:babel|webpack)[.]config[.](?:js|cjs|mjs|ts|cts|mts|json)$", // other configs
				],
			},
			to: {},
		},
		{
			name: "no-deprecated-core",
			comment:
				"A module depends on a node core module that has been deprecated. Find an alternative - these are " +
				"bound to exist - node doesn't deprecate lightly.",
			severity: "warn",
			from: {},
			to: {
				dependencyTypes: ["core"],
				path: [
					"^v8/tools/codemap$",
					"^v8/tools/consarray$",
					"^v8/tools/csvparser$",
					"^v8/tools/logreader$",
					"^v8/tools/profile_view$",
					"^v8/tools/profile$",
					"^v8/tools/SourceMap$",
					"^v8/tools/splaytree$",
					"^v8/tools/tickprocessor-driver$",
					"^v8/tools/tickprocessor$",
					"^node-inspect/lib/_inspect$",
					"^node-inspect/lib/internal/inspect_client$",
					"^node-inspect/lib/internal/inspect_repl$",
					"^async_hooks$",
					"^punycode$",
					"^domain$",
					"^constants$",
					"^sys$",
					"^_linklist$",
					"^_stream_wrap$",
				],
			},
		},
		{
			name: "not-to-deprecated",
			comment:
				"This module uses a (version of an) npm module that has been deprecated. Either upgrade to a later " +
				"version of that module, or find an alternative. Deprecated modules are a security risk.",
			severity: "warn",
			from: {},
			to: {
				dependencyTypes: ["deprecated"],
			},
		},
		{
			name: "no-non-package-json",
			severity: "error",
			comment:
				"This module depends on an npm package that isn't in the 'dependencies' section of your package.json. " +
				"That's problematic as the package either (1) won't be available on live (2 - worse) will be " +
				"available on live with an non-guaranteed version. Fix it by adding the package to the dependencies " +
				"in your package.json.",
			from: {},
			to: {
				dependencyTypes: ["npm-no-pkg", "npm-unknown"],
			},
		},
		{
			name: "not-to-unresolvable",
			comment:
				"This module depends on a module that cannot be found ('resolved to disk'). If it's an npm " +
				"module: add it to your package.json. In all other cases you likely already know what to do.",
			severity: "error",
			from: {},
			to: { couldNotResolve: true },
		},
		{
			name: "no-duplicate-dep-types",
			comment:
				"Likely this module depends on an external ('npm') package that occurs more than once " +
				"in your package.json i.e. bot as a devDependencies and in dependencies. This will cause " +
				"maintenance problems later on.",
			severity: "warn",
			from: {},
			to: {
				moreThanOneDependencyType: true,
				// as it's pretty common to have a type import be a type only import
				// _and_ (e.g.) a devDependency - don't consider type-only dependency
				// types for this rule
				dependencyTypesNot: ["type-only"],
			},
		},

		/* rules you might want to tweak for your specific situation: */

		{
			name: "not-to-spec",
			comment:
				"This module depends on a spec (test) file. The sole responsibility of a spec file is to test code. " +
				"If there's something in a spec that's of use to other modules, it doesn't have that single " +
				"responsibility anymore. Factor it out into (e.g.) a separate utility/ helper or a mock.",
			severity: "error",
			from: {},
			to: {
				path: "[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$",
			},
		},
		{
			name: "not-to-dev-dep",
			severity: "error",
			comment:
				"This module depends on an npm package from the 'devDependencies' section of your " +
				"package.json. It looks like something that ships to production, though. To prevent problems " +
				"with npm packages that aren't there on production declare it (only!) in the 'dependencies'" +
				"section of your package.json. If this module is development only - add it to the " +
				"from.pathNot re of the not-to-dev-dep rule in the dependency-cruiser configuration",
			from: {
				path: "^(app/src|packages/.*/src)",
				pathNot: "[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$",
			},
			to: {
				dependencyTypes: ["npm-dev"],
				// type only dependencies are not a problem as they don't end up in the
				// production code or are ignored by the runtime.
				dependencyTypesNot: ["type-only"],
				pathNot: ["node_modules/@types/"],
			},
		},
		{
			name: "optional-deps-used",
			severity: "info",
			comment:
				"This module depends on an npm package that is declared as an optional dependency " +
				"in your package.json. As this makes sense in limited situations only, it's flagged here. " +
				"If you're using an optional dependency here by design - add an exception to your" +
				"dependency-cruiser configuration.",
			from: {},
			to: {
				dependencyTypes: ["npm-optional"],
			},
		},
		{
			name: "peer-deps-used",
			comment:
				"This module depends on an npm package that is declared as a peer dependency " +
				"in your package.json. This makes sense if your package is e.g. a plugin, but in " +
				"other cases - maybe not so much. If the use of a peer dependency is intentional " +
				"add an exception to your dependency-cruiser configuration.",
			severity: "warn",
			from: {},
			to: {
				dependencyTypes: ["npm-peer"],
			},
		},
	],
	options: {
		/* Which modules not to follow further when encountered */
		doNotFollow: {
			/* path: an array of regular expressions in strings to match against */
			path: [
				"node_modules",
				"\\.stories\\.(ts|tsx|js|jsx)$",
				"\\.(test|spec)\\.(ts|tsx|js|jsx)$",
				"^\\.next",
			],
		},

		/* Which modules to exclude */
		exclude: {
			/* path: an array of regular expressions in strings to match against */
			path: EXCLUDE_PATHS,
		},

		/* if true combines the package.jsons found from the module up to the base
       folder the cruise is initiated from. Useful for how (some) mono-repos
       manage dependencies & dependency definitions.
     */
		combinedDependencies: true,
		/* TypeScript project file ('tsconfig.json') to use for
       (1) compilation and
       (2) resolution (e.g. with the paths property)

       We use the root tsconfig.json which contains path mappings for the monorepo.
     */
		tsConfig: {
			fileName: "tsconfig.json",
		},

		/* options to pass on to enhanced-resolve, the package dependency-cruiser
       uses to resolve module references to disk.
     */
		enhancedResolveOptions: {
			exportsFields: ["exports"],
			conditionNames: ["import", "require", "node", "default", "types"],
			mainFields: ["module", "main", "types", "typings"],
		},

		/* skipAnalysisNotInRules will make dependency-cruiser execute
       analysis strictly necessary for checking the rule set only.
     */
		skipAnalysisNotInRules: true,

		reporterOptions: {
			dot: {
				/* pattern of modules that can be consolidated in the detailed
           graphical dependency graph.
         */
				collapsePattern: COLLAPSE_PATTERN,

				theme: {
					graph: {
						splines: "true",
					},
					dependencies: [
						{
							criteria: {
								resolved: EXCLUDE_PATHS,
							},
							attributes: {
								style: "invis",
							},
						},
					],
				},
			},
			archi: {
				collapsePattern: "node_modules/(?:@[^/]+/[^/]+|[^/]+)",
			},
			text: {
				highlightFocused: true,
			},
		},
	},
};
