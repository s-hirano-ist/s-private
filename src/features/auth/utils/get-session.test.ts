import { NotAllowedError, UnauthorizedError } from "@/error-classes";
import { auth } from "@/features/auth/utils/auth";
import {
	checkSelfAuthOrRedirectToAuth,
	checkSelfAuthOrThrow,
	getSelfRole,
	getUserId,
	hasAdminPermissionOrThrow,
	hasSelfPostPermissionOrThrow,
	hasUpdateStatusPermissionOrThrow,
} from "@/features/auth/utils/get-session";
import {
	checkAdminPermission,
	checkPostPermission,
	checkUpdateStatusPermission,
} from "@/features/auth/utils/role";
import { redirect } from "next/navigation";
import { type Mock, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/utils/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("@/features/auth/utils/role", () => ({
	checkAdminPermission: vi.fn(),
	checkPostPermission: vi.fn(),
	checkUpdateStatusPermission: vi.fn(),
}));

describe("get-session utilities", () => {
	describe("checkSelfAuthOrThrow", () => {
		it("should return the session if authenticated", async () => {
			const mockSession = { user: { id: "123", role: "admin" } };
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

	describe("checkSelfAuthOrRedirectToAuth", () => {
		it("should return the session if authenticated", async () => {
			const mockSession = { user: { id: "123", role: "admin" } };
			(auth as Mock).mockResolvedValue(mockSession);

			const result = await checkSelfAuthOrRedirectToAuth();

			expect(auth).toHaveBeenCalledTimes(1);
			expect(result).toEqual(mockSession);
		});

		it("should redirect to /auth if not authenticated", async () => {
			(auth as Mock).mockResolvedValue(null);

			await checkSelfAuthOrRedirectToAuth();

			expect(auth).toHaveBeenCalledTimes(1);
			expect(redirect).toHaveBeenCalledWith("/auth");
		});
	});

	describe("hasAdminPermissionOrThrow", () => {
		it("should not throw if admin permission is granted", async () => {
			(checkAdminPermission as Mock).mockResolvedValue(true);

			await expect(hasAdminPermissionOrThrow()).resolves.not.toThrow();
			expect(checkAdminPermission).toHaveBeenCalledTimes(1);
		});

		it("should throw NotAllowedError if admin permission is denied", async () => {
			(checkAdminPermission as Mock).mockResolvedValue(false);

			await expect(hasAdminPermissionOrThrow()).rejects.toThrow(
				NotAllowedError,
			);
			expect(checkAdminPermission).toHaveBeenCalledTimes(1);
		});
	});

	describe("hasSelfPostPermissionOrThrow", () => {
		it("should not throw if post permission is granted", async () => {
			(checkPostPermission as Mock).mockResolvedValue(true);

			await expect(hasSelfPostPermissionOrThrow()).resolves.not.toThrow();
			expect(checkPostPermission).toHaveBeenCalledTimes(1);
		});

		it("should throw NotAllowedError if post permission is denied", async () => {
			(checkPostPermission as Mock).mockResolvedValue(false);

			await expect(hasSelfPostPermissionOrThrow()).rejects.toThrow(
				NotAllowedError,
			);
			expect(checkPostPermission).toHaveBeenCalledTimes(1);
		});
	});

	describe("hasUpdateStatusPermissionOrThrow", () => {
		it("should not throw if update status permission is granted", async () => {
			(checkUpdateStatusPermission as Mock).mockResolvedValue(true);

			await expect(hasUpdateStatusPermissionOrThrow()).resolves.not.toThrow();
			expect(checkUpdateStatusPermission).toHaveBeenCalledTimes(1);
		});

		it("should throw NotAllowedError if update status permission is denied", async () => {
			(checkUpdateStatusPermission as Mock).mockResolvedValue(false);

			await expect(hasUpdateStatusPermissionOrThrow()).rejects.toThrow(
				NotAllowedError,
			);
			expect(checkUpdateStatusPermission).toHaveBeenCalledTimes(1);
		});
	});

	describe("getUserId", () => {
		it("should return the user ID from the session", async () => {
			const mockSession = { user: { id: "123", role: "admin" } };
			(auth as Mock).mockResolvedValue(mockSession);

			const result = await getUserId();

			expect(auth).toHaveBeenCalledTimes(1);
			expect(result).toBe("123");
		});
	});

	describe("getSelfRole", () => {
		it("should return the user role from the session", async () => {
			const mockSession = { user: { id: "123", role: "admin" } };
			(auth as Mock).mockResolvedValue(mockSession);

			const result = await getSelfRole();

			expect(auth).toHaveBeenCalledTimes(1);
			expect(result).toBe("admin");
		});
	});
});
