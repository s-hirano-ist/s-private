import { resolveBackendUrl } from "@/common/backend/resolve-backend-url";
import { afterEach, describe, expect, test, vi } from "vitest";

afterEach(() => vi.unstubAllEnvs());

describe("resolveBackendUrl", () => {
	test("connects Preview to its related backend branch instead of the explicit origin", () => {
		vi.stubEnv("VERCEL", "1");
		vi.stubEnv("VERCEL_ENV", "preview");
		vi.stubEnv("BACKEND_URL", "https://explicit.example.com");
		vi.stubEnv(
			"VERCEL_RELATED_PROJECTS",
			JSON.stringify([
				{
					project: { id: "prj_backend", name: "backend" },
					production: { alias: "production.example.com" },
					preview: { branch: "backend-git-feature.example.com" },
				},
			]),
		);
		expect(
			resolveBackendUrl({
				vercel: "1",
				vercelEnv: "preview",
				backendUrl: "https://explicit.example.com",
			}),
		).toBe("https://backend-git-feature.example.com");
	});

	test("does not fall back to a related Production deployment when Preview is missing", () => {
		vi.stubEnv("VERCEL", "1");
		vi.stubEnv("VERCEL_ENV", "preview");
		vi.stubEnv("BACKEND_URL", undefined);
		vi.stubEnv(
			"VERCEL_RELATED_PROJECTS",
			JSON.stringify([
				{
					project: { id: "prj_backend", name: "backend" },
					production: { alias: "production.example.com" },
					preview: {},
				},
			]),
		);
		expect(
			resolveBackendUrl({ vercel: "1", vercelEnv: "preview" }),
		).toBeUndefined();
	});

	test.each(["production", "development"])(
		"keeps the explicit %s origin",
		(environment) => {
			vi.stubEnv("VERCEL", "1");
			vi.stubEnv("VERCEL_ENV", environment);
			vi.stubEnv("BACKEND_URL", "https://configured.example.com");
			expect(
				resolveBackendUrl({
					vercel: "1",
					vercelEnv: environment,
					backendUrl: "https://configured.example.com",
				}),
			).toBe("https://configured.example.com");
		},
	);

	test("supports explicit origins without related project data", () => {
		vi.stubEnv("VERCEL", "1");
		vi.stubEnv("VERCEL_ENV", "preview");
		vi.stubEnv("VERCEL_RELATED_PROJECTS", undefined);
		vi.stubEnv("BACKEND_URL", "https://configured.example.com");
		expect(
			resolveBackendUrl({
				vercel: "1",
				vercelEnv: "preview",
				backendUrl: "https://configured.example.com",
			}),
		).toBe("https://configured.example.com");
	});
});
