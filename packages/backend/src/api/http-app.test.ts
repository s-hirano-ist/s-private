import { createBackendHttpApp } from "@s-hirano-ist/s-backend/api/http-app";
import { describe, expect, test, vi } from "vite-plus/test";

function setup() {
	const cookies = new Headers();
	cookies.append("set-cookie", "state=one; HttpOnly");
	cookies.append("set-cookie", "aux=two; HttpOnly");
	const auth = vi.fn(async (request: Request) =>
		Response.json(
			{
				url: request.url,
				host: request.headers.get("host"),
				cookie: request.headers.get("cookie"),
				forwarded: request.headers.get("x-forwarded-host"),
				body: request.method === "POST" ? await request.text() : null,
			},
			{ headers: cookies },
		),
	);
	const api = vi.fn((request: Request) =>
		Response.json({
			url: request.url,
			authorization: request.headers.get("authorization"),
		}),
	);
	const signIn = vi.fn(
		async (request: Request) =>
			new Response(null, {
				status: 307,
				headers: { location: new URL("/", request.url).href },
			}),
	);
	const reportError = vi.fn();
	const app = createBackendHttpApp({
		api,
		auth,
		signIn,
		cron: async () => new Response(null, { status: 401 }),
		publicOrigin: "https://web.example",
		isTrustedOrigin: (origin) =>
			["https://web.example", "https://preview.example"].includes(origin),
		reportError,
	});
	return { app, auth, api, signIn, reportError };
}
describe("backend HTTP host", () => {
	test("reconstructs public OAuth URL and preserves body and separate cookies", async () => {
		const { app } = setup();
		const response = await app.request(
			"https://backend.example/api/auth/callback/auth0?code=secret",
			{
				method: "POST",
				body: "callback-body",
				headers: {
					"x-s-private-web-origin": "https://preview.example",
					cookie: "state=one",
					"x-forwarded-host": "attacker.example",
				},
			},
		);
		expect(await response.json()).toEqual({
			url: "https://preview.example/api/auth/callback/auth0?code=secret",
			host: "preview.example",
			cookie: "state=one",
			forwarded: null,
			body: "callback-body",
		});
		expect(response.headers.getSetCookie()).toHaveLength(2);
		expect(response.headers.get("cache-control")).toBe("private, no-store");
	});
	test("rejects untrusted forwarded public origin before auth", async () => {
		const { app, auth } = setup();
		expect(
			(
				await app.request("https://backend.example/api/auth/get-session", {
					headers: { "x-s-private-web-origin": "https://attacker.example" },
				})
			).status,
		).toBe(403);
		expect(auth).not.toHaveBeenCalled();
	});
	test("redirects sign-in to public origin and keeps Bearer API requests intact", async () => {
		const { app } = setup();
		expect(
			(await app.request("https://backend.example/api/sign-in")).headers.get(
				"location",
			),
		).toBe("https://web.example/");
		const response = await app.request(
			"https://backend.example/api/v1/session",
			{ headers: { authorization: "Bearer native-token" } },
		);
		expect(await response.json()).toEqual({
			url: "https://backend.example/api/v1/session",
			authorization: "Bearer native-token",
		});
	});
	test("exposes health without DB and reports unexpected failures without exposing them", async () => {
		const { app, auth, reportError } = setup();
		expect((await app.request("/health")).status).toBe(200);
		auth.mockRejectedValueOnce(new Error("private-database-error"));
		const response = await app.request("/api/auth/get-session");
		expect(response.status).toBe(500);
		expect(await response.text()).not.toContain("private-database-error");
		expect(reportError).toHaveBeenCalledOnce();
	});
});
