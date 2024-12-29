import { UnexpectedError } from "@/error-classes";
import { checkSelfAuthOrThrow } from "@/features/auth/utils/get-session";
import {
	hasContentsPermission,
	hasDumperPermission,
} from "@/features/auth/utils/role";
import prisma from "@/prisma";
import { type Mock, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/utils/get-session", () => ({
	checkSelfAuthOrThrow: vi.fn(),
}));

describe("role utilities", () => {
	describe("hasContentsPermission", () => {
		it("should return true if the user role is ADMIN", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "ADMIN" },
			});

			const result = await hasContentsPermission();

			expect(result).toBe(true);
		});

		it("should return false if the user role is not ADMIN", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "VIEWER" },
			});

			const result = await hasContentsPermission();

			expect(result).toBe(false);
		});

		it("should throw UnexpectedError for invalid roles", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "INVALID_ROLE" },
			});

			await expect(hasContentsPermission()).rejects.toThrow(UnexpectedError);
		});
	});

	describe("hasDumperPermission", () => {
		it("should return true for ADMIN or EDITOR roles", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "ADMIN" },
			});

			const result = await hasDumperPermission();

			expect(result).toBe(true);
		});

		it("should return false for VIEWER or UNAUTHORIZED roles", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "VIEWER" },
			});

			const result = await hasDumperPermission();

			expect(result).toBe(false);
		});

		it("should throw UnexpectedError for invalid roles", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "INVALID_ROLE" },
			});

			await expect(hasDumperPermission()).rejects.toThrow(UnexpectedError);
		});
	});
});
