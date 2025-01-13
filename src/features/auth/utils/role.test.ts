import { UnauthorizedError } from "@/error-classes";
import { auth } from "@/features/auth/utils/auth";
import {
	checkSelfAuthOrThrow,
	getSelfId,
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/features/auth/utils/role";
import { type Mock, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/utils/auth", () => ({
	auth: vi.fn(),
	checkSelfAuthOrThrow: vi.fn(),
}));

vi.mock("@/features/auth/utils/role", () => ({
	hasContentsPermission: vi.fn(),
	hasDumperPermission: vi.fn(),
}));

describe.skip("role utilities", () => {
	describe("checkSelfAuthOrThrow", () => {
		it("should return the session if authenticated", async () => {
			const mockSession = { user: { roles: ["dumper"] } };
			(auth as Mock).mockResolvedValue(mockSession);

			const result = await checkSelfAuthOrThrow();

			expect(auth).toHaveBeenCalledTimes(1);
			expect(result).toEqual(mockSession);
		});

		it("should throw UnauthorizedError if not authenticated", async () => {
			(auth as Mock).mockResolvedValue(null);

			await expect(checkSelfAuthOrThrow()).rejects.toThrow(UnauthorizedError);
			expect(auth).toHaveBeenCalledTimes(1);
		});
	});

	describe("getSelfId", () => {
		it("should return the user ID from the session", async () => {
			const mockSession = { user: { id: "123", role: "admin" } };
			(auth as Mock).mockResolvedValue(mockSession);

			const result = await getSelfId();

			expect(auth).toHaveBeenCalledTimes(1);
			expect(result).toBe("123");
		});
	});

	describe("hasViewerAdminPermission", () => {
		it("should return true if the user role is viewer", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { roles: ["viewer"] },
			});

			const result = await hasViewerAdminPermission();

			expect(result).toBe(true);
		});

		it("should return true if the user role is viewer and dumper", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { roles: ["viewer", "dumper"] },
			});

			const result = await hasViewerAdminPermission();

			expect(result).toBe(true);
		});

		it("should return false if the user role is unexpected", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { roles: ["unknown"] },
			});

			const result = await hasViewerAdminPermission();

			expect(result).toBe(false);
		});

		it("should return false if the user role is empty", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { roles: [] },
			});

			const result = await hasViewerAdminPermission();

			expect(result).toBe(false);
		});
	});

	describe("hasDumperPostPermission", () => {
		it("should return true if the user role is dumper", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { roles: ["dumper"] },
			});

			const result = await hasDumperPostPermission();

			expect(result).toBe(true);
		});

		it("should return true if the user role is dumper and viewer", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { roles: ["dumper", "viewer"] },
			});

			const result = await hasDumperPostPermission();

			expect(result).toBe(true);
		});

		it("should return true if the user role is unexpected", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { roles: ["unknown"] },
			});

			const result = await hasDumperPostPermission();

			expect(result).toBe(false);
		});

		it("should return true if the user role is empty", async () => {
			(checkSelfAuthOrThrow as Mock).mockResolvedValue({
				user: { roles: [] },
			});

			const result = await hasDumperPostPermission();

			expect(result).toBe(false);
		});
	});
});
