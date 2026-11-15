import * as actions from "@/application-services/rss/actions";
import { getBackendClient } from "@/common/backend/server-client";
import { beforeEach, expect, test, vi } from "vitest";
vi.mock("@/common/backend/server-client", () => ({
	getBackendClient: vi.fn(),
}));
const client = {
	getRssPage: vi.fn(),
	subscribeRss: vi.fn(),
	unsubscribeRss: vi.fn(),
	markRssRead: vi.fn(),
	saveRss: vi.fn(),
	unsaveRss: vi.fn(),
	refreshRss: vi.fn(),
	importRss: vi.fn(),
};
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(getBackendClient).mockResolvedValue(
		client as unknown as Awaited<ReturnType<typeof getBackendClient>>,
	);
});
test("loads the requested page and unwraps backend envelopes", async () => {
	client.getRssPage.mockResolvedValue({ data: { unread: [] } });
	expect(await actions.loadRss()).toEqual({ unread: [] });
	await actions.loadRss(50, "feed");
	expect(client.getRssPage).toHaveBeenLastCalledWith({
		offset: 50,
		feedId: "feed",
	});
	client.refreshRss.mockResolvedValue({ data: { data: [] } });
	expect(await actions.refreshRss(["feed"], true)).toEqual({ data: [] });
	expect(client.refreshRss).toHaveBeenCalledWith({
		ids: ["feed"],
		force: true,
	});
	client.importRss.mockResolvedValue({ data: { added: 2 } });
	expect(await actions.importRss("opml", "<opml/>")).toEqual({ added: 2 });
	expect(client.importRss).toHaveBeenCalledWith({
		kind: "opml",
		content: "<opml/>",
	});
});
test("forwards all mutations and lets backend failures reach the reader", async () => {
	const feed = { url: "https://example.com/feed", title: "News", folder: "" };
	const entry = {
		url: "https://example.com/one",
		title: "One",
		publishedAt: null,
	};
	await actions.subscribeRss(feed);
	expect(client.subscribeRss).toHaveBeenCalledWith(feed);
	await actions.unsubscribeRss("feed");
	expect(client.unsubscribeRss).toHaveBeenCalledWith("feed");
	await actions.markRssRead({ ids: ["one"] });
	expect(client.markRssRead).toHaveBeenCalledWith({ ids: ["one"] });
	await actions.saveRss(entry);
	expect(client.saveRss).toHaveBeenCalledWith(entry);
	await actions.unsaveRss("one");
	expect(client.unsaveRss).toHaveBeenCalledWith("one");
	client.subscribeRss.mockRejectedValueOnce(new Error("Backend unavailable"));
	await expect(actions.subscribeRss(feed)).rejects.toThrow(
		"Backend unavailable",
	);
});
