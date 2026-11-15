import type {
	RssRepository,
	FeedLease,
} from "@s-hirano-ist/s-application/rss/ports";
import { createRssService } from "@s-hirano-ist/s-application/rss/service";
import { expect, test, vi } from "vitest";
const lease: FeedLease = {
	id: "feed",
	url: "https://example.com",
	title: "Feed",
	folder: "",
	lastFetchedAt: null,
	error: null,
	token: "token",
	etag: null,
	lastModified: null,
};
function repository() {
	return {
		page: vi.fn(),
		subscribe: vi.fn(),
		unsubscribe: vi.fn(),
		read: vi.fn(),
		save: vi.fn(),
		unsave: vi.fn(),
		claim: vi.fn(),
		complete: vi.fn(),
		fail: vi.fn(),
	} satisfies RssRepository;
}
test("a claimed feed failure releases its lease without preventing another feed completing", async () => {
	const repo = repository();
	repo.claim
		.mockResolvedValueOnce({ ...lease, id: "bad" })
		.mockResolvedValueOnce({ ...lease, id: "good" })
		.mockResolvedValueOnce(null);
	const fetch = vi
		.fn()
		.mockRejectedValueOnce(new Error("network"))
		.mockResolvedValueOnce({
			entries: [],
			notModified: false,
			title: "Feed",
			etag: null,
			lastModified: null,
		});
	const service = createRssService(repo, fetch);
	expect(await service.refresh("owner", ["bad", "good", "busy"])).toEqual([
		{ id: "bad", status: "failed" },
		{ id: "good", status: "updated" },
		{ id: "busy", status: "skipped" },
	]);
	expect(repo.fail).toHaveBeenCalledWith("owner", { ...lease, id: "bad" });
	expect(repo.complete).toHaveBeenCalledTimes(1);
	expect(fetch).toHaveBeenCalledTimes(2);
});
test("import reports invalid and duplicate metadata without creating unread entries", async () => {
	const repo = repository();
	repo.subscribe.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
	repo.save.mockResolvedValue(false);
	const service = createRssService(repo, vi.fn());
	expect(
		await service.import("owner", {
			feeds: [lease, lease],
			saved: [
				{ title: "Saved", url: "https://example.com", publishedAt: null },
			],
			invalid: 1,
		}),
	).toEqual({ added: 1, duplicates: 2, invalid: 1 });
	expect(repo.complete).not.toHaveBeenCalled();
});
