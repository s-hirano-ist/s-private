import { resolveWebOrigin } from "@/common/backend/resolve-web-origin";
import { expect, test } from "vite-plus/test";

const preview = { vercel: "1", vercelEnv: "preview" };

test("uses the requesting Preview alias even with a stale localhost setting", () => {
	expect(
		resolveWebOrigin({
			...preview,
			betterAuthUrl: "http://localhost:3000",
			headers: new Headers({
				host: "memdex-web-git-feature-s-hirano-ist-team.vercel.app",
			}),
		}),
	).toBe("https://memdex-web-git-feature-s-hirano-ist-team.vercel.app");
});

test("uses Vercel's forwarded Web host without accepting an incoming Origin", () => {
	expect(
		resolveWebOrigin({
			...preview,
			headers: new Headers({
				host: "internal.example",
				"x-forwarded-host": "memdex-web-abc123-s-hirano-ist-team.vercel.app",
				origin: "https://attacker.example",
			}),
		}),
	).toBe("https://memdex-web-abc123-s-hirano-ist-team.vercel.app");
});

test.each([
	"attacker.example",
	"memdex-backend-abc-s-hirano-ist-team.vercel.app",
	"memdex-web-abc-other-team.vercel.app",
	"memdex-web-abc-s-hirano-ist-team.vercel.app.attacker.example",
	"memdex-web-abc-s-hirano-ist-team.vercel.app:8443",
	"memdex-web-abc-s-hirano-ist-team.vercel.app,attacker.example",
	"",
])("rejects an untrusted Preview host: %s", (host) => {
	expect(() =>
		resolveWebOrigin({ ...preview, headers: new Headers({ host }) }),
	).toThrow("Untrusted Preview Web host");
});

test("keeps Production canonical even if the request host differs", () => {
	expect(
		resolveWebOrigin({
			vercel: "1",
			vercelEnv: "production",
			betterAuthUrl: "https://private.s-hirano.com",
			headers: new Headers({ host: "attacker.example" }),
		}),
	).toBe("https://private.s-hirano.com");
});

test("requires an explicit Production origin and preserves local HTTP", () => {
	expect(() =>
		resolveWebOrigin({
			vercel: "1",
			vercelEnv: "production",
			headers: new Headers(),
		}),
	).toThrow("BETTER_AUTH_URL");
	expect(
		resolveWebOrigin({
			betterAuthUrl: "http://localhost:3000",
			headers: new Headers(),
		}),
	).toBe("http://localhost:3000");
});
