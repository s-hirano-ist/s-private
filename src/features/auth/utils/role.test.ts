import { UnexpectedError } from "@/error-classes";
import { checkSelfAuthOrThrow } from "@/features/auth/utils/get-session";
import {
	checkAdminPermission,
	checkPostPermission,
	checkUpdateStatusPermission,
} from "@/features/auth/utils/role";
import prisma from "@/prisma";
import { type Mock, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/utils/get-session", () => ({
	checkSelfAuthOrThrow: vi.fn(),
}));

describe("role utilities", () => {
	describe("checkAdminPermission", () => {
		it("should return true if the user role is ADMIN", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "ADMIN" },
			});

			const result = await checkAdminPermission();

			expect(result).toBe(true);
		});

		it("should return false if the user role is not ADMIN", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "VIEWER" },
			});

			const result = await checkAdminPermission();

			expect(result).toBe(false);
		});

		it("should throw UnexpectedError for invalid roles", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "INVALID_ROLE" },
			});

			await expect(checkAdminPermission()).rejects.toThrow(UnexpectedError);
		});
	});

	describe("checkPostPermission", () => {
		it("should return true for ADMIN or EDITOR roles", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "ADMIN" },
			});

			const result = await checkPostPermission();

			expect(result).toBe(true);
		});

		it("should return false for VIEWER or UNAUTHORIZED roles", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "VIEWER" },
			});

			const result = await checkPostPermission();

			expect(result).toBe(false);
		});

		it("should throw UnexpectedError for invalid roles", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "INVALID_ROLE" },
			});

			await expect(checkPostPermission()).rejects.toThrow(UnexpectedError);
		});
	});

	describe("checkUpdateStatusPermission", () => {
		it("should return true for ADMIN or EDITOR roles", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "EDITOR" },
			});

			const result = await checkUpdateStatusPermission();

			expect(result).toBe(true);
		});

		it("should return false for VIEWER or UNAUTHORIZED roles", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "UNAUTHORIZED" },
			});

			const result = await checkUpdateStatusPermission();

			expect(result).toBe(false);
		});

		it("should throw UnexpectedError for invalid roles", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { role: "INVALID_ROLE" },
			});

			await expect(checkUpdateStatusPermission()).rejects.toThrow(
				UnexpectedError,
			);
		});
	});
});
