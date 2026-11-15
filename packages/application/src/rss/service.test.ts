import type {
	RssRepository,
	FeedLease,
} from "@s-hirano-ist/s-application/rss/ports";
import { RssFetchError } from "@s-hirano-ist/s-application/rss/failure";
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
	const service = createRssService(repo, fetch, vi.fn());
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
	const service = createRssService(repo, vi.fn(), vi.fn());
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
	const service = createRssService(repo, vi.fn(), vi.fn());
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

test("reports safe feed context and continues refreshing when diagnostics are unavailable", async () => {
	const repo = repository();
	repo.claim.mockResolvedValue(lease);
	const raw = Object.assign(new Error("secret SQL and token"), {
		url: "https://private.example?token=secret",
	});
	const report = vi
		.fn()
		.mockRejectedValue(new Error("diagnostics unavailable"));
	const service = createRssService(
		repo,
		vi.fn().mockRejectedValue(raw),
		report,
	);
	expect(await service.refresh("owner", ["feed"])).toEqual([
		{ id: "feed", status: "failed" },
	]);
	expect(repo.fail).toHaveBeenCalledOnce();
	expect(report).toHaveBeenCalledWith({
		feedId: "feed",
		stage: "fetch",
		reason: "unknown_error",
		storageCode: undefined,
		hostname: "example.com",
		durationMs: expect.any(Number),
	});
	expect(JSON.stringify(report.mock.calls)).not.toMatch(
		/secret|owner|token|SQL/u,
	);
});
test("distinguishes database claim, commit and release errors without serializing database contents", async () => {
	const repo = repository();
	const report = vi.fn();
	const raw = Object.assign(new Error("private database query"), {
		code: "P2034",
	});
	const fetch = vi.fn().mockResolvedValue({
		entries: [],
		notModified: false,
		title: "",
		etag: null,
		lastModified: null,
	});
	const service = createRssService(repo, fetch, report);
	repo.claim.mockRejectedValueOnce(raw);
	await expect(service.refresh("owner", ["feed"])).rejects.toThrow(raw);
	expect(report).toHaveBeenLastCalledWith(
		expect.objectContaining({ stage: "claim", reason: "storage_error" }),
	);
	repo.claim.mockResolvedValue(lease);
	repo.complete.mockRejectedValue(raw);
	expect(await service.refresh("owner", ["feed"])).toEqual([
		{ id: "feed", status: "failed" },
	]);
	expect(report).toHaveBeenLastCalledWith(
		expect.objectContaining({
			stage: "complete",
			reason: "storage_error",
			storageCode: "P2034",
		}),
	);
	repo.fail.mockRejectedValue(raw);
	await expect(service.refresh("owner", ["feed"])).rejects.toThrow(raw);
	expect(report).toHaveBeenLastCalledWith(
		expect.objectContaining({ stage: "release", reason: "storage_error" }),
	);
	expect(JSON.stringify(report.mock.calls)).not.toContain(
		"private database query",
	);
});

test("preserves structured fetch diagnostics and identifies the failed subscription", async () => {
	const repo = repository();
	repo.claim.mockResolvedValue(lease);
	const report = vi.fn();
	const diagnostic = {
		stage: "http" as const,
		reason: "http_status" as const,
		hostname: "redirect.example",
		httpStatus: 429,
		redirects: 1,
		bytes: 0,
		durationMs: 99,
	};
	await createRssService(
		repo,
		vi.fn().mockRejectedValue(new RssFetchError(diagnostic)),
		report,
	).refresh("owner", ["feed"]);
	expect(report).toHaveBeenCalledWith(
		expect.objectContaining({ ...diagnostic, feedId: "feed" }),
	);
	expect(repo.fail).toHaveBeenCalledOnce();
});
