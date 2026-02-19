import { describe, expect, test } from "vitest";
import { ArticleCreatedEvent } from "./article-created-event.ts";
import { ArticleDeletedEvent } from "./article-deleted-event.ts";

describe("ArticleCreatedEvent", () => {
	test("should have eventType 'article.created'", () => {
		const event = new ArticleCreatedEvent({
			title: "Test Article",
			url: "https://example.com",
			quote: "A quote",
			categoryName: "Tech",
			userId: "user-123",
			caller: "addArticle",
		});
		expect(event.eventType).toBe("article.created");
	});

	test("should set payload correctly", () => {
		const event = new ArticleCreatedEvent({
			title: "Test Article",
			url: "https://example.com",
			quote: "A quote",
			categoryName: "Tech",
			userId: "user-123",
			caller: "addArticle",
		});
		expect(event.payload).toEqual({
			title: "Test Article",
			url: "https://example.com",
			quote: "A quote",
			categoryName: "Tech",
		});
	});

	test("should set metadata correctly", () => {
		const event = new ArticleCreatedEvent({
			title: "Test Article",
			url: "https://example.com",
			quote: "A quote",
			categoryName: "Tech",
			userId: "user-123",
			caller: "addArticle",
		});
		expect(event.metadata.caller).toBe("addArticle");
		expect(event.metadata.userId).toBe("user-123");
		expect(event.metadata.timestamp).toBeInstanceOf(Date);
	});
});

describe("ArticleDeletedEvent", () => {
	test("should have eventType 'article.deleted'", () => {
		const event = new ArticleDeletedEvent({
			title: "Deleted Article",
			userId: "user-123",
			caller: "deleteArticle",
		});
		expect(event.eventType).toBe("article.deleted");
	});

	test("should set payload correctly", () => {
		const event = new ArticleDeletedEvent({
			title: "Deleted Article",
			userId: "user-123",
			caller: "deleteArticle",
		});
		expect(event.payload).toEqual({ title: "Deleted Article" });
	});

	test("should set metadata correctly", () => {
		const event = new ArticleDeletedEvent({
			title: "Deleted Article",
			userId: "user-123",
			caller: "deleteArticle",
		});
		expect(event.metadata.caller).toBe("deleteArticle");
		expect(event.metadata.userId).toBe("user-123");
		expect(event.metadata.timestamp).toBeInstanceOf(Date);
	});
});
