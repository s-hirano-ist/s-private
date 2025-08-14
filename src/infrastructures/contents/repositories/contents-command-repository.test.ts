import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/prisma", () => ({
	default: {
		contents: {
			create: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

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

			const inputData = {
				title: "Test Content",
				markdown: "# Test Content\n\nThis is test markdown content.",
				userId: "user123",
			};

			vi.mocked(prisma.contents.create).mockResolvedValue(mockContents);

			const result = await contentsCommandRepository.create(inputData);

			expect(prisma.contents.create).toHaveBeenCalledWith({
				data: inputData,
			});
			expect(result).toEqual(mockContents);
		});

		test("should handle database errors during create", async () => {
			const inputData = {
				title: "Test Content",
				markdown: "# Test Content\n\nThis is test markdown content.",
				userId: "user123",
			};

			vi.mocked(prisma.contents.create).mockRejectedValue(
				new Error("Database constraint error"),
			);

			await expect(contentsCommandRepository.create(inputData)).rejects.toThrow(
				"Database constraint error",
			);

			expect(prisma.contents.create).toHaveBeenCalledWith({
				data: inputData,
			});
		});
	});
});
