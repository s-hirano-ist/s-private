import { refreshRss } from "@/application-services/rss/client";
import { afterEach, expect, test, vi } from "vite-plus/test";

afterEach(() => vi.unstubAllGlobals());
test("refreshes through the authenticated same-origin API without Server Actions", async () => {
	const id = "00000000-0000-4000-8000-000000000001";
	const data = { data: [{ id, status: "updated" }] };
	const fetch = vi
		.fn<typeof globalThis.fetch>()
		.mockResolvedValue(Response.json(data));
	vi.stubGlobal("fetch", fetch);
	expect(await refreshRss([id], true)).toEqual(data);
	expect(fetch).toHaveBeenCalledTimes(1);
	const [url, options] = fetch.mock.calls[0];
	expect((url as URL).href).toBe(
		new URL("/api/v1/rss/refresh", window.location.origin).href,
	);
	expect(options?.method).toBe("POST");
	expect(options?.credentials).toBe("same-origin");
	expect(JSON.parse(options?.body as string)).toEqual({
		ids: [id],
		force: true,
	});
});
