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

test("owner-scoped operations forward filters and mutations", async () => {
	const repo = repository();
	const service = createRssService(repo, vi.fn());
	await service.page("owner", 50, "feed");
	expect(repo.page).toHaveBeenCalledWith("owner", 50, "feed");
	await service.subscribe("owner", lease);
	expect(repo.subscribe).toHaveBeenCalledWith("owner", lease);
	await service.unsubscribe("owner", "feed");
	expect(repo.unsubscribe).toHaveBeenCalledWith("owner", "feed");
	await service.read("owner", { ids: ["one"] });
	expect(repo.read).toHaveBeenCalledWith("owner", { ids: ["one"] });
	const entry = {
		title: "One",
		url: "https://example.com/one",
		publishedAt: null,
	};
	await service.save("owner", entry);
	expect(repo.save).toHaveBeenCalledWith("owner", entry);
	await service.unsave("owner", "one");
	expect(repo.unsave).toHaveBeenCalledWith("owner", "one");
	repo.save.mockResolvedValue(true);
	expect(
		await service.import("owner", { feeds: [], saved: [entry], invalid: 0 }),
	).toEqual({ added: 1, duplicates: 0, invalid: 0 });
});
