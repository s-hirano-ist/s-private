import { loadRss } from "@/application-services/rss/client";
import { afterEach, expect, test, vi } from "vite-plus/test";

afterEach(() => vi.unstubAllGlobals());
test("reads pages through the authenticated API independently of Server Actions", async () => {
	const data = {
		snapshotRevision: 3,
		newerCount: 2,
		offset: 50,
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
	expect(await loadRss(50, "feed-id", "unread", undefined, 3)).toEqual(data);
	const [url, options] = fetch.mock.calls[0];
	expect((url as URL).pathname).toBe("/api/v1/rss");
	expect((url as URL).searchParams.get("offset")).toBe("50");
	expect((url as URL).searchParams.get("feedId")).toBe("feed-id");
	expect((url as URL).searchParams.get("view")).toBe("unread");
	expect((url as URL).searchParams.get("snapshotRevision")).toBe("3");
	expect(options?.method).toBe("GET");
	expect(options?.credentials).toBe("same-origin");
});
