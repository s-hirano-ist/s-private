import { isTrustedWebOrigin } from "@s-hirano-ist/s-backend/auth/web-origin";
import { expect, test } from "vitest";

const config = { BETTER_AUTH_URL: "https://private.s-hirano.com", VERCEL: "1" };

test.each([
	"https://private.s-hirano.com",
	"https://s-private-git-feature-s-hirano-ist-team.vercel.app",
	"https://memdex-web-859kcw346-s-hirano-ist-team.vercel.app",
	"https://memdex-web-git-codex-recovery-s-hirano-ist-team.vercel.app",
])(
	"trusts the public Web origin and this team's Web deployment %s",
	(origin) => {
		expect(isTrustedWebOrigin(origin, config)).toBe(true);
	},
);

test.each([
	"https://memdex-backend-git-feature-s-hirano-ist-team.vercel.app",
	"https://memdex-web-git-feature-other-team.vercel.app",
	"https://memdex-web-abc-s-hirano-ist-team.vercel.app.attacker.example",
	"http://memdex-web-abc-s-hirano-ist-team.vercel.app",
	"https://memdex-web-abc-s-hirano-ist-team.vercel.app:8443",
	"https://memdex-web-abc-s-hirano-ist-team.vercel.app/path",
	"https://memdex-web-abc-s-hirano-ist-team.vercel.app?query=value",
	"not a URL",
])("rejects an untrusted origin %s", (origin) => {
	expect(isTrustedWebOrigin(origin, config)).toBe(false);
});

test("does not trust Preview aliases outside Vercel", () => {
	expect(
		isTrustedWebOrigin("https://memdex-web-abc-s-hirano-ist-team.vercel.app", {
			BETTER_AUTH_URL: config.BETTER_AUTH_URL,
		}),
	).toBe(false);
});
