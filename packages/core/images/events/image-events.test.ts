import { describe, expect, test } from "vitest";
import { ImageCreatedEvent } from "./image-created-event.ts";
import { ImageDeletedEvent } from "./image-deleted-event.ts";

describe("ImageCreatedEvent", () => {
	test("should have eventType 'image.created'", () => {
		const event = new ImageCreatedEvent({
			id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b",
			path: "image.jpg",
			userId: "user-123",
			caller: "addImage",
		});
		expect(event.eventType).toBe("image.created");
	});

	test("should set payload correctly", () => {
		const event = new ImageCreatedEvent({
			id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b",
			path: "image.jpg",
			userId: "user-123",
			caller: "addImage",
		});
		expect(event.payload).toEqual({
			id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b",
			path: "image.jpg",
		});
	});

	test("should set metadata correctly", () => {
		const event = new ImageCreatedEvent({
			id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b",
			path: "image.jpg",
			userId: "user-123",
			caller: "addImage",
		});
		expect(event.metadata.caller).toBe("addImage");
		expect(event.metadata.userId).toBe("user-123");
		expect(event.metadata.timestamp).toBeInstanceOf(Date);
	});
});

describe("ImageDeletedEvent", () => {
	test("should have eventType 'image.deleted'", () => {
		const event = new ImageDeletedEvent({
			path: "01912c9a-image.jpg",
			userId: "user-123",
			caller: "deleteImage",
		});
		expect(event.eventType).toBe("image.deleted");
	});

	test("should set payload correctly", () => {
		const event = new ImageDeletedEvent({
			path: "01912c9a-image.jpg",
			userId: "user-123",
			caller: "deleteImage",
		});
		expect(event.payload).toEqual({ path: "01912c9a-image.jpg" });
	});

	test("should set metadata correctly", () => {
		const event = new ImageDeletedEvent({
			path: "01912c9a-image.jpg",
			userId: "user-123",
			caller: "deleteImage",
		});
		expect(event.metadata.caller).toBe("deleteImage");
		expect(event.metadata.userId).toBe("user-123");
		expect(event.metadata.timestamp).toBeInstanceOf(Date);
	});
});
