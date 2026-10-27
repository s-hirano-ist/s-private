import { createApiAuth } from "s-private-backend/api/auth";
import { expect, test, vi } from "vite-plus/test";

function setup() {
	const getSession = vi.fn(async (_input: { headers: Headers }) => ({
		response: null,
		headers: new Headers(),
	}));
	const auth = createApiAuth(
		{ LOCAL_DEV_MODE: "false", NODE_ENV: "test", VERCEL: "1" },
		{ api: { getSession } } as unknown as Parameters<typeof createApiAuth>[1],
		{} as Parameters<typeof createApiAuth>[2],
		{ captureException: vi.fn() },
	);
	return { auth, getSession };
}

test("resolves direct Better Auth API calls with the validated Preview Web host", async () => {
	const { auth, getSession } = setup();
	const headers = new Headers({
		cookie: "session=secret",
		host: "backend.example",
		"x-s-private-web-origin":
			"https://memdex-web-abc-s-hirano-ist-team.vercel.app",
		"x-forwarded-host": "attacker.example",
	});
	await auth.getWebSession(headers);
	const received = getSession.mock.calls[0][0].headers;
	expect(received.get("host")).toBe(
		"memdex-web-abc-s-hirano-ist-team.vercel.app",
	);
	expect(received.get("cookie")).toBe("session=secret");
	expect(received.has("x-forwarded-host")).toBe(false);
	expect(headers.get("host")).toBe("backend.example");
});

test.each([
	["missing", new Headers()],
	["attacker", new Headers({ origin: "https://attacker.example" })],
	["localhost", new Headers({ origin: "http://localhost:3000" })],
	["Production", new Headers({ origin: "https://private.s-hirano.com" })],
] as const)(
	"does not invoke auth for an untrusted Preview origin: %s",
	async (_name, headers) => {
		const { auth, getSession } = setup();
		expect(await auth.getWebSession(headers)).toEqual({ session: null });
		expect(getSession).not.toHaveBeenCalled();
	},
);
