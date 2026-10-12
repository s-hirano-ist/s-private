// @vitest-environment node
import { forwardBackendRequest } from "@/common/backend/forward-request";
import { describe, expect, test, vi } from "vite-plus/test";

describe("Web backend forwarding", () => {
	test("uses fixed upstream, preserves encoded paths/query, allows only protocol headers", async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValue(new Response(null, { status: 204 }));
		await forwardBackendRequest(
			new Request(
				"https://web.example/api/v1/notes/title/a%2Fb?status=EXPORTED",
				{
					headers: {
						cookie: "session=one",
						authorization: "Bearer native",
						origin: "https://web.example",
						"x-forwarded-host": "attacker.example",
						"x-s-private-web-origin": "https://attacker.example",
						"x-private": "secret",
					},
				},
			),
			"https://backend.example",
			fetcher,
		);
		const [url, init] = fetcher.mock.calls[0];
		expect(url).toEqual(
			new URL(
				"https://backend.example/api/v1/notes/title/a%2Fb?status=EXPORTED",
			),
		);
		const headers = new Headers(init?.headers);
		expect(headers.get("cookie")).toBe("session=one");
		expect(headers.get("authorization")).toBe("Bearer native");
		expect(headers.get("origin")).toBe("https://web.example");
		expect(headers.get("x-s-private-web-origin")).toBe("https://web.example");
		expect(headers.has("x-forwarded-host")).toBe(false);
		expect(headers.has("x-private")).toBe(false);
		expect(init?.redirect).toBe("manual");
		expect(init?.cache).toBe("no-store");
	});
	test("keeps redirect, separate OAuth cookies and byte streaming", async () => {
		const headers = new Headers({
			location: "https://auth0.example/authorize",
		});
		headers.append("set-cookie", "state=one; HttpOnly");
		headers.append("set-cookie", "aux=two; HttpOnly");
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response(null, { status: 307, headers }))
			.mockResolvedValueOnce(
				new Response(new Uint8Array([0, 255, 17]), {
					headers: {
						"content-type": "image/png",
						"content-encoding": "gzip",
						"content-length": "100",
						"transfer-encoding": "chunked",
					},
				}),
			);
		const redirect = await forwardBackendRequest(
			new Request("https://web.example/api/sign-in"),
			"https://backend.example",
			fetcher,
		);
		expect(redirect.status).toBe(307);
		expect(redirect.headers.get("location")).toBe(
			"https://auth0.example/authorize",
		);
		expect(redirect.headers.getSetCookie()).toHaveLength(2);
		const media = await forwardBackendRequest(
			new Request("https://web.example/api/v1/media/images/id/original"),
			"https://backend.example",
			fetcher,
		);
		expect(media.headers.get("cache-control")).toBe("private, no-store");
		expect(media.headers.get("content-type")).toBe("image/png");
		expect(media.headers.has("content-encoding")).toBe(false);
		expect(media.headers.has("content-length")).toBe(false);
		expect(media.headers.has("transfer-encoding")).toBe(false);
		expect(new Uint8Array(await media.arrayBuffer())).toEqual(
			new Uint8Array([0, 255, 17]),
		);
	});
	test("forwards binary chunks once and never reads a bodyless mutation", async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValue(new Response(null, { status: 204 }));
		const bytes = new Uint8Array(1048576);
		bytes[0] = 255;
		await forwardBackendRequest(
			new Request("https://web.example/api/v1/uploads/id/chunks/0", {
				method: "PUT",
				headers: { "content-type": "application/octet-stream" },
				body: bytes,
			}),
			"https://backend.example",
			fetcher,
		);
		expect(
			new Uint8Array(fetcher.mock.calls[0][1]?.body as ArrayBuffer),
		).toEqual(bytes);
		expect(fetcher).toHaveBeenCalledOnce();
		for (const [method, path] of [
			["DELETE", "notes/id"],
			["POST", "uploads/id/complete"],
		]) {
			const request = new Request("https://web.example/api/v1/" + path, {
				method,
			});
			vi.spyOn(request, "arrayBuffer").mockRejectedValue(
				new Error("body must not be read"),
			);
			await forwardBackendRequest(request, "https://backend.example", fetcher);
		}
	});
	test("rejects unrelated paths and does not retry upstream failure", async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockRejectedValue(new Error("offline"));
		expect(
			(
				await forwardBackendRequest(
					new Request("https://web.example/private"),
					"https://backend.example",
					fetcher,
				)
			).status,
		).toBe(404);
		expect(fetcher).not.toHaveBeenCalled();
		await expect(
			forwardBackendRequest(
				new Request("https://web.example/api/v1/notes"),
				"https://backend.example",
				fetcher,
			),
		).rejects.toThrow("offline");
		expect(fetcher).toHaveBeenCalledOnce();
	});
});
