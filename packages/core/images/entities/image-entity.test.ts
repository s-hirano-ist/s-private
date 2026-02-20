import { describe, expect, test, vi } from "vitest";
import { ZodError } from "zod";
import { makeUserId } from "../../shared-kernel/entities/common-entity";
import {
	makeContentType,
	makeFileSize,
	makePath,
} from "../../shared-kernel/entities/file-entity";
import {
	InvalidFormatError,
	UnexpectedError,
} from "../../shared-kernel/errors/error-classes";
import * as entityFactory from "../../shared-kernel/services/entity-factory";
import { imageEntity, makePixel } from "./image-entity";

describe("imageEntity", () => {
	describe("makePixel", () => {
		test("should create valid pixel value", () => {
			const pixel = makePixel(1920);
			expect(pixel).toBe(1920);
		});

		test("should accept 1 as minimum positive integer", () => {
			const pixel = makePixel(1);
			expect(pixel).toBe(1);
		});

		test("should throw error for zero", () => {
			expect(() => makePixel(0)).toThrow(ZodError);
		});

		test("should throw error for negative number", () => {
			expect(() => makePixel(-1)).toThrow(ZodError);
		});

		test("should throw error for decimal number", () => {
			expect(() => makePixel(1.5)).toThrow(ZodError);
		});
	});

	describe("imageEntity.create", () => {
		const validArgs = {
			userId: makeUserId("test-user-id"),
			path: makePath("test-image.jpg", false),
			contentType: makeContentType("image/jpeg"),
			fileSize: makeFileSize(1024),
			caller: "test",
		};

		test("should create image with valid arguments", () => {
			const [image, event] = imageEntity.create(validArgs);

			expect(image.userId).toBe("test-user-id");
			expect(image.path).toBe("test-image.jpg");
			expect(image.contentType).toBe("image/jpeg");
			expect(image.fileSize).toBe(1024);
			expect(image.status).toBe("UNEXPORTED");
			expect(image.id).toBeDefined();
			expect(event.eventType).toBe("image.created");
		});

		test("should create image with optional width and height", () => {
			const [image] = imageEntity.create({
				...validArgs,
				width: makePixel(1920),
				height: makePixel(1080),
			});

			expect(image.width).toBe(1920);
			expect(image.height).toBe(1080);
		});

		test("should create frozen object", () => {
			const [image] = imageEntity.create(validArgs);
			expect(Object.isFrozen(image)).toBe(true);
		});

		test("should auto-generate ID", () => {
			const [image] = imageEntity.create(validArgs);
			expect(image.id).toBeDefined();
			expect(typeof image.id).toBe("string");
			expect(image.id.length).toBeGreaterThan(0);
		});

		test("should set status to UNEXPORTED", () => {
			const [image] = imageEntity.create(validArgs);
			expect(image.status).toBe("UNEXPORTED");
		});

		test("should generate ImageCreatedEvent with correct payload", () => {
			const [image, event] = imageEntity.create(validArgs);
			expect(event.eventType).toBe("image.created");
			expect(event.payload.id).toBe(image.id);
			expect(event.payload.path).toBe("test-image.jpg");
			expect(event.metadata.caller).toBe("test");
			expect(event.metadata.userId).toBe("test-user-id");
			expect(event.metadata.timestamp).toBeInstanceOf(Date);
		});

		test("should use createEntityWithErrorHandling for exception handling", () => {
			const spy = vi.spyOn(entityFactory, "createEntityWithErrorHandling");

			imageEntity.create(validArgs);

			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith(expect.any(Function));

			spy.mockRestore();
		});

		test("should throw InvalidFormatError when validation fails", () => {
			const spy = vi
				.spyOn(entityFactory, "createEntityWithErrorHandling")
				.mockImplementation(() => {
					throw new InvalidFormatError();
				});

			expect(() => imageEntity.create(validArgs)).toThrow(InvalidFormatError);

			spy.mockRestore();
		});

		test("should throw UnexpectedError when unexpected error occurs", () => {
			const spy = vi
				.spyOn(entityFactory, "createEntityWithErrorHandling")
				.mockImplementation(() => {
					throw new UnexpectedError();
				});

			expect(() => imageEntity.create(validArgs)).toThrow(UnexpectedError);

			spy.mockRestore();
		});
	});
});
