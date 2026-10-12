import { resolve } from "node:path";
import { defineConfig } from "orval";

const root = process.env.API_GENERATION_ROOT ?? process.cwd();

export default defineConfig({
	backend: {
		input: resolve(root, "docs/openapi/backend-v1.json"),
		output: {
			target: resolve(root, "packages/api-client/src/generated/backend.ts"),
			schemas: {
				path: resolve(root, "packages/api-client/src/generated/models"),
				type: "zod",
				importPath: "@s-hirano-ist/s-api-client/models",
			},
			client: "fetch",
			urlEncodeParameters: true,
			mode: "single",
			clean: true,
			tsconfig: {
				compilerOptions: { module: "NodeNext", moduleResolution: "NodeNext" },
			},
			override: {
				fetch: {
					includeHttpResponseReturnType: true,
					forceSuccessResponse: true,
					runtimeValidation: true,
					useRuntimeFetcher: true,
				},
				zod: { strict: { response: true } },
			},
		},
	},
});
