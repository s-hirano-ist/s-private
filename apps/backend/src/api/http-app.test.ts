import { createBackendHttpApp } from "s-private-backend/api/http-app";
import { AuthInitializationError } from "s-private-backend/auth/recoverable-auth";
import { describe, expect, test, vi } from "vite-plus/test";

function setup(
	objectStorageUnavailable = false,
	publicOrigin: string | null = "https://web.example",
) {
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
		objectStorageUnavailable,
		api,
		auth,
		signIn,
		cron: async () => new Response(null, { status: 401 }),
		publicOrigin: publicOrigin ?? undefined,
		isTrustedOrigin: (origin) =>
			["https://web.example", "https://preview.example"].includes(origin),
		reportError,
	});
	return { app, auth, api, signIn, reportError };
}
describe("backend HTTP host", () => {
	test.each(["/api/sign-in", "/api/auth/callback/auth0?code=secret"])(
		"returns retryable 503 without reporting an initialization failure again: %s",
		async (path) => {
			const { app, signIn, auth, reportError } = setup();
			signIn.mockRejectedValue(new AuthInitializationError());
			auth.mockRejectedValue(new AuthInitializationError());
			const response = await app.request(`https://backend.example${path}`);
			expect(response.status).toBe(503);
			expect(response.headers.get("retry-after")).toBe("30");
			expect(response.headers.get("cache-control")).toBe("private, no-store");
			expect(await response.json()).toEqual({
				error: { code: "API_UNAVAILABLE" },
			});
			expect(reportError).not.toHaveBeenCalled();
		},
	);
	test("requires the BFF's validated origin when Preview has no canonical origin", async () => {
		const { app, signIn } = setup(false, null);
		expect(
			(await app.request("https://backend.example/api/sign-in")).status,
		).toBe(403);
		expect(signIn).not.toHaveBeenCalled();
		const response = await app.request("https://backend.example/api/sign-in", {
			headers: { "x-s-private-web-origin": "https://preview.example" },
		});
		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe("https://preview.example/");
	});
	test.each([
		["GET", "/api/v1/media/images/image/original"],
		["GET", "/api/v1/media/books/book/thumbnail"],
		["POST", "/api/v1/uploads"],
		["GET", "/api/v1/uploads/upload"],
		["PUT", "/api/v1/uploads/upload/chunks/0"],
		["POST", "/api/v1/uploads/upload/complete"],
		["DELETE", "/api/v1/uploads/upload"],
	])(
		"returns 404 for disabled storage %s %s before persistence",
		async (method, path) => {
			const { app, api, auth, reportError } = setup(true);
			const response = await app.request(path, { method });
			expect(response.status).toBe(404);
			expect(await response.json()).toEqual({ error: { code: "NOT_FOUND" } });
			expect(response.headers.get("cache-control")).toBe("private, no-store");
			expect(api).not.toHaveBeenCalled();
			expect(auth).not.toHaveBeenCalled();
			expect(reportError).not.toHaveBeenCalled();
		},
	);
	test("keeps session and content metadata APIs available during the outage", async () => {
		const { app, api } = setup(true);
		for (const path of [
			"/api/v1/session",
			"/api/v1/articles",
			"/api/v1/notes",
			"/api/v1/books",
			"/api/v1/images",
		]) {
			expect((await app.request(path)).status).toBe(200);
		}
		expect(api).toHaveBeenCalledTimes(5);
	});
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
	test("waits for error delivery before completing a serverless response", async () => {
		const { app, signIn, reportError } = setup();
		let finishReporting = () => {};
		const reporting = new Promise<void>((resolve) => {
			finishReporting = resolve;
		});
		reportError.mockReturnValue(reporting);
		signIn.mockRejectedValueOnce(new Error("authentication failed"));
		let completed = false;
		const request = Promise.resolve(app.request("/api/sign-in")).then(
			(response) => {
				completed = true;
				return response;
			},
		);
		await vi.waitFor(() => expect(reportError).toHaveBeenCalledOnce());
		expect(completed).toBe(false);
		finishReporting();
		expect((await request).status).toBe(500);
	});
});
