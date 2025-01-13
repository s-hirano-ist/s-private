import { UnauthorizedError } from "@/error-classes";
import { auth } from "@/features/auth/utils/auth";
import {
	getSelfId,
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/features/auth/utils/role";
import { Session } from "next-auth";
import { type Mock, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/utils/auth", () => ({ auth: vi.fn() }));

const mockDumperRoleSession: Session = {
	user: { id: "1", roles: ["dumper"] },
	expires: "2025-01-01",
};
const mockViewerRoleSession: Session = {
	user: { id: "2", roles: ["viewer"] },
	expires: "2025-01-01",
};
const mockDumperViewerRoleSession: Session = {
	user: { id: "3", roles: ["dumper", "viewer"] },
	expires: "2025-01-01",
};
const mockUnexpectedRoleSession: Session = {
	// @ts-ignore: for test
	user: { id: "3", roles: ["unknown"] },
	expires: "2025-01-01",
};
const mockEmptyRoleSession: Session = {
	user: { id: "4", roles: [] },
	expires: "2025-01-01",
};
const mockUnauthenticatedUserSession = null;

describe("role utilities", () => {
	describe("getSelfId", () => {
		it("should return the user ID from the session", async () => {
			(auth as Mock).mockResolvedValue(mockViewerRoleSession);

			const result = await getSelfId();

			expect(auth).toHaveBeenCalledTimes(1);
			expect(result).toBe("2");
		});
	});

	describe("hasViewerAdminPermission", () => {
		it("should return true if the user role is viewer", async () => {
			(auth as Mock).mockResolvedValue(mockViewerRoleSession);

			const result = await hasViewerAdminPermission();

			expect(result).toBe(true);
		});

		it("should return true if the user role is viewer and dumper", async () => {
			(auth as Mock).mockResolvedValue(mockDumperViewerRoleSession);

			const result = await hasViewerAdminPermission();

			expect(result).toBe(true);
		});

		it("should return false if the user role is unexpected", async () => {
			(auth as Mock).mockResolvedValue(mockUnexpectedRoleSession);

			const result = await hasViewerAdminPermission();

			expect(result).toBe(false);
		});

		it("should return false if the user role is empty", async () => {
			(auth as Mock).mockResolvedValue(mockEmptyRoleSession);

			const result = await hasViewerAdminPermission();

			expect(result).toBe(false);
		});

		it("should throw UnauthorizedError if not authenticated", async () => {
			(auth as Mock).mockResolvedValue(mockUnauthenticatedUserSession);

			await expect(hasViewerAdminPermission).rejects.toThrow(UnauthorizedError);
			expect(auth).toHaveBeenCalledTimes(1);
		});
	});

	describe("hasDumperPostPermission", () => {
		it("should return true if the user role is dumper", async () => {
			(auth as Mock).mockResolvedValue(mockDumperRoleSession);

			const result = await hasDumperPostPermission();

			expect(result).toBe(true);
		});

		it("should return true if the user role is dumper and viewer", async () => {
			(auth as Mock).mockResolvedValue(mockDumperViewerRoleSession);

			const result = await hasDumperPostPermission();

			expect(result).toBe(true);
		});

		it("should return true if the user role is unexpected", async () => {
			(auth as Mock).mockResolvedValue(mockUnexpectedRoleSession);

			const result = await hasDumperPostPermission();

			expect(result).toBe(false);
		});

		it("should return true if the user role is empty", async () => {
			(auth as Mock).mockResolvedValue(mockEmptyRoleSession);

			const result = await hasDumperPostPermission();

			expect(result).toBe(false);
		});

		it("should return true if the user role is empty", async () => {
			(auth as Mock).mockResolvedValue(mockEmptyRoleSession);

			const result = await hasDumperPostPermission();

			expect(result).toBe(false);
		});

		it("should throw UnauthorizedError if not authenticated", async () => {
			(auth as Mock).mockResolvedValue(mockUnauthenticatedUserSession);

			await expect(hasDumperPostPermission).rejects.toThrow(UnauthorizedError);
			expect(auth).toHaveBeenCalledTimes(1);
		});
	});
});
