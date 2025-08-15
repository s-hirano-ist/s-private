import { beforeEach, describe, expect, test, vi } from "vitest";

import { Status } from "@/generated";
import prisma from "@/prisma";
import { contentsCommandRepository } from "./contents-command-repository";

describe("ContentsCommandRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create", () => {
		test("should create contents successfully", async () => {
			const mockContents = {
				id: "1",
				title: "Test Content",
				markdown: "# Test Content\n\nThis is test markdown content.",
				userId: "user123",
				status: "UNEXPORTED" as Status,
				createdAt: new Date(),
				updatedAt: new Date(),
				exportedAt: null,
			};

			vi.mocked(prisma.contents.create).mockResolvedValue(mockContents);

			const result = await contentsCommandRepository.create({
				title: "Test Content",
				markdown: "# Test Content\n\nThis is test markdown content.",
				userId: "user123",
				id: "1",
				status: "UNEXPORTED",
			});

			expect(prisma.contents.create).toHaveBeenCalledWith({
				data: {
					title: "Test Content",
					markdown: "# Test Content\n\nThis is test markdown content.",
					userId: "user123",
					id: "1",
					status: "UNEXPORTED",
				},
			});
			expect(result).toBeUndefined();
		});

		test("should handle database errors during create", async () => {
			vi.mocked(prisma.contents.create).mockRejectedValue(
				new Error("Database constraint error"),
			);

			await expect(
				contentsCommandRepository.create({
					title: "Test Content",
					markdown: "# Test Content\n\nThis is test markdown content.",
					userId: "user123",
					id: "1",
					status: "EXPORTED",
				}),
			).rejects.toThrow("Database constraint error");

			expect(prisma.contents.create).toHaveBeenCalledWith({
				data: {
					title: "Test Content",
					markdown: "# Test Content\n\nThis is test markdown content.",
					userId: "user123",
					id: "1",
					status: "EXPORTED",
				},
			});
		});
	});
});
