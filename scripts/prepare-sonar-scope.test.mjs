import assert from "node:assert/strict";
// oxlint-disable-next-line vitest/no-import-node-test -- This CI helper is verified with node --test without loading the app test environment.
import { test } from "node:test";
import { isSonarSource, prepareSonarScope } from "./prepare-sonar-scope.mjs";

test("limits production analysis to workspace JavaScript and TypeScript", () => {
	for (const path of [
		"apps/web/src/app/[locale]/page.tsx",
		"apps/backend/src/env.ts",
		"packages/core/articles/article.ts",
		"packages/ui/src/button.tsx",
	]) {
		assert.equal(isSonarSource(path), true, path);
	}
	for (const path of [
		"apps/ios/App.swift",
		"apps/web/src/app/icon.png",
		"packages/database/prisma/schema.prisma",
		"packages/core/article.test.ts",
		"packages/ui/button.stories.tsx",
		"packages/ui/button.bench.tsx",
		"packages/api-client/type-tests/client.ts",
		"packages/api-client/src/generated/client.ts",
		"packages/ui/dist/index.js",
		"packages/scripts/dist-package/index.js",
		"packages/ui/vitest.config.ts",
		"scripts/local-dev.mjs",
	]) {
		assert.equal(isSonarSource(path), false, path);
	}
});

test("preserves baseline exclusions and adds only out-of-scope tracked paths", () => {
	assert.equal(
		prepareSonarScope(
			"sonar.exclusions=**/generated/**\nsonar.qualitygate.wait=false\n",
			[
				"apps/web/src/page.tsx",
				"apps/ios/App.swift",
				"branding/icon.png",
				"branding/icon.png",
			],
		),
		"sonar.exclusions=**/generated/**,apps/ios/**,branding/**\nsonar.qualitygate.wait=false\n",
	);
	assert.throws(() =>
		prepareSonarScope("sonar.exclusions=\n", ["docs/a,b.md"]),
	);
});
