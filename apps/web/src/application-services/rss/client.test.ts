import { loadRss, refreshRss } from "@/application-services/rss/client";
import { afterEach, expect, test, vi } from "vite-plus/test";

afterEach(() => vi.unstubAllGlobals());
test("reads pages through the authenticated API independently of Server Actions", async () => {
	const data = {
		feeds: [],
		unread: [],
		saved: [],
		unreadCount: 0,
		savedCount: 0,
	};
	const fetch = vi
		.fn<typeof globalThis.fetch>()
		.mockResolvedValue(Response.json(data));
	vi.stubGlobal("fetch", fetch);
	expect(await loadRss(50, "feed-id")).toEqual(data);
	const [url, options] = fetch.mock.calls[0];
	expect((url as URL).pathname).toBe("/api/v1/rss");
	expect((url as URL).searchParams.get("offset")).toBe("50");
	expect((url as URL).searchParams.get("feedId")).toBe("feed-id");
	expect((url as URL).searchParams.get("view")).toBe("unread");
	expect(options?.method).toBe("GET");
	expect(options?.credentials).toBe("same-origin");
});
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
