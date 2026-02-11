import {
	makeContentType,
	makeFileSize,
	makePixel,
	Path,
} from "@s-hirano-ist/s-core/images/entities/image-entity";
import type { Status } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import {
	makeCreatedAt,
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import prisma from "@/prisma";
import { imagesCommandRepository } from "./images-command-repository";

// Simple path parser for testing (the original makePath generates UUIDs)
const makeTestPath = (v: string): Path => Path.parse(v);

describe("ImageCommandRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create", () => {
		test("should create image successfully", async () => {
			const mockImage = {
				id: "image-123",
				path: "image-123",
				userId: "user123",
				contentType: "image/png",
				fileSize: 1024,
				width: 800,
				height: 600,
				status: "UNEXPORTED" as Status,
				createdAt: new Date(),
				updatedAt: new Date(),
				exportedAt: new Date(),
			};

			vi.mocked(prisma.image.create).mockResolvedValue(mockImage);

			const result = await imagesCommandRepository.create({
				id: makeId("01234567-89ab-7def-8123-456789abcdef"),
				path: makeTestPath("image-123"),
				userId: makeUserId("user123"),
				contentType: makeContentType("image/png"),
				fileSize: makeFileSize(1024),
				width: makePixel(800),
				height: makePixel(600),
				status: makeUnexportedStatus(),
				createdAt: makeCreatedAt(),
			});

			expect(prisma.image.create).toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		test("should create image with minimal data", async () => {
			vi.mocked(prisma.image.create).mockResolvedValue({
				id: "image-456",
				path: "image-456",
				userId: "user123",
				contentType: "image/jpeg",
				fileSize: null,
				width: null,
				height: null,
				status: "UNEXPORTED" as Status,
				createdAt: new Date(),
				updatedAt: new Date(),
				exportedAt: new Date(),
			});

			const result = await imagesCommandRepository.create({
				path: makeTestPath("image-456"),
				userId: makeUserId("user123"),
				contentType: makeContentType("image/jpeg"),
				status: makeUnexportedStatus(),
				id: makeId("01234567-89ab-7def-8123-456789abcde1"),
				fileSize: makeFileSize(1024),
				width: makePixel(640),
				height: makePixel(480),
				createdAt: makeCreatedAt(),
			});

			expect(prisma.image.create).toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		test("should handle database errors during create", async () => {
			vi.mocked(prisma.image.create).mockRejectedValue(
				new Error("Database constraint error"),
			);

			await expect(
				imagesCommandRepository.create({
					path: makeTestPath("image-123"),
					userId: makeUserId("user123"),
					contentType: makeContentType("image/png"),
					status: makeUnexportedStatus(),
					id: makeId("01234567-89ab-7def-8123-456789abcde1"),
					fileSize: makeFileSize(1024),
					width: makePixel(800),
					height: makePixel(600),
					createdAt: makeCreatedAt(),
				}),
			).rejects.toThrow("Database constraint error");

			expect(prisma.image.create).toHaveBeenCalled();
		});
	});

	describe("deleteById", () => {
		test("should delete image and log success", async () => {
			const id = makeId("0198bfc4-444e-73e8-9ef6-eb9b250ed1ae");
			const userId = makeUserId("test-user-id");
			const status = makeUnexportedStatus();

			vi.mocked(prisma.image.delete).mockResolvedValue({
				path: "images/user123/image-123.png",
			} as Awaited<ReturnType<typeof prisma.image.delete>>);

			await imagesCommandRepository.deleteById(id, userId, status);

			expect(prisma.image.delete).toHaveBeenCalledWith({
				where: { id, userId, status },
				select: { path: true },
			});
		});

		test("should delete image with different status and log", async () => {
			const id = makeId("0198bfc5-555f-74f9-af07-fc9c251fe2bf");
			const userId = makeUserId("test-user-id-2");
			const status = "EXPORTED";

			vi.mocked(prisma.image.delete).mockResolvedValue({
				path: "images/user456/image-456.jpg",
			} as Awaited<ReturnType<typeof prisma.image.delete>>);

			await imagesCommandRepository.deleteById(id, userId, status);

			expect(prisma.image.delete).toHaveBeenCalledWith({
				where: { id, userId, status },
				select: { path: true },
			});
		});

		test("should handle deletion errors", async () => {
			const id = makeId("0198bfc4-444e-73e8-9ef6-eb9b250ed1ae");
			const userId = makeUserId("test-user-id");
			const status = makeUnexportedStatus();

			vi.mocked(prisma.image.delete).mockRejectedValue(
				new Error("Image not found"),
			);

			await expect(
				imagesCommandRepository.deleteById(id, userId, status),
			).rejects.toThrow("Image not found");

			expect(prisma.image.delete).toHaveBeenCalledWith({
				where: { id, userId, status },
				select: { path: true },
			});
		});
	});
});
