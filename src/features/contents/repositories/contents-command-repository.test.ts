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

	describe("deleteById", () => {
		test("should delete contents successfully", async () => {
			vi.mocked(prisma.contents.delete).mockResolvedValue({
				id: "1",
				title: "Test Content",
				markdown: "Test markdown",
				userId: "user123",
				status: "EXPORTED",
				createdAt: new Date(),
				updatedAt: new Date(),
				exportedAt: new Date(),
			});

			await contentsCommandRepository.deleteById("1", "user123", "EXPORTED");

			expect(prisma.contents.delete).toHaveBeenCalledWith({
				where: { id: "1", userId: "user123", status: "EXPORTED" },
			});
		});

		test("should handle not found errors during delete", async () => {
			vi.mocked(prisma.contents.delete).mockRejectedValue(
				new Error("Record not found"),
			);

			await expect(
				contentsCommandRepository.deleteById("999", "user123", "EXPORTED"),
			).rejects.toThrow("Record not found");

			expect(prisma.contents.delete).toHaveBeenCalledWith({
				where: { id: "999", userId: "user123", status: "EXPORTED" },
			});
		});

		test("should delete contents with different status", async () => {
			vi.mocked(prisma.contents.delete).mockResolvedValue({
				id: "2",
				title: "Another Content",
				markdown: "Another markdown",
				userId: "user123",
				status: "UNEXPORTED",
				createdAt: new Date(),
				updatedAt: new Date(),
				exportedAt: null,
			});

			await contentsCommandRepository.deleteById("2", "user123", "UNEXPORTED");

			expect(prisma.contents.delete).toHaveBeenCalledWith({
				where: { id: "2", userId: "user123", status: "UNEXPORTED" },
			});
		});
	});
});
