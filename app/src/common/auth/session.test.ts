import { describe, expect, test, vi } from "vitest";

const mockGetSession = vi.fn();

vi.mock("@/infrastructures/auth/auth", () => ({
	auth: {
		api: {
			getSession: mockGetSession,
		},
	},
}));

import {
	getSelfId,
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";

type MockSession = {
	user: { id: string; roles?: string[] };
	session: { expiresAt: Date };
};

const mockDumperRoleSession: MockSession = {
	user: { id: "1", roles: ["dumper"] },
	session: { expiresAt: new Date("2025-01-01") },
};
const mockViewerRoleSession: MockSession = {
	user: { id: "2", roles: ["viewer"] },
	session: { expiresAt: new Date("2025-01-01") },
};
const mockDumperViewerRoleSession: MockSession = {
	user: { id: "3", roles: ["dumper", "viewer"] },
	session: { expiresAt: new Date("2025-01-01") },
};
const mockUnexpectedRoleSession: MockSession = {
	user: { id: "3", roles: ["unknown"] },
	session: { expiresAt: new Date("2025-01-01") },
};
const mockEmptyRoleSession: MockSession = {
	user: { id: "4", roles: [] },
	session: { expiresAt: new Date("2025-01-01") },
};
const mockUnauthenticatedUserSession = null;

describe("session utilities", () => {
	describe("getSelfId", () => {
		test("should return the user ID from the session", async () => {
			mockGetSession.mockResolvedValue(mockViewerRoleSession);

			const result = await getSelfId();

			expect(mockGetSession).toHaveBeenCalledTimes(1);
			expect(result).toBe("2");
		});
	});

	describe("hasViewerAdminPermission", () => {
		test("should return true if the user role is viewer", async () => {
			mockGetSession.mockResolvedValue(mockViewerRoleSession);

			const result = await hasViewerAdminPermission();

			expect(result).toBe(true);
		});

		test("should return true if the user role is viewer and dumper", async () => {
			mockGetSession.mockResolvedValue(mockDumperViewerRoleSession);

			const result = await hasViewerAdminPermission();

			expect(result).toBe(true);
		});

		test("should return false if the user role is unexpected", async () => {
			mockGetSession.mockResolvedValue(mockUnexpectedRoleSession);

			const result = await hasViewerAdminPermission();

			expect(result).toBe(false);
		});

		test("should return false if the user role is empty", async () => {
			mockGetSession.mockResolvedValue(mockEmptyRoleSession);

			const result = await hasViewerAdminPermission();

			expect(result).toBe(false);
		});

		test("should throw Unauthorized if not authenticated", async () => {
			mockGetSession.mockResolvedValue(mockUnauthenticatedUserSession);

			await expect(hasViewerAdminPermission).rejects.toThrow("UNAUTHORIZED");
			expect(mockGetSession).toHaveBeenCalledTimes(1);
		});
	});

	describe("hasDumperPostPermission", () => {
		test("should return true if the user role is dumper", async () => {
			mockGetSession.mockResolvedValue(mockDumperRoleSession);

			const result = await hasDumperPostPermission();

			expect(result).toBe(true);
		});

		test("should return true if the user role is dumper and viewer", async () => {
			mockGetSession.mockResolvedValue(mockDumperViewerRoleSession);

			const result = await hasDumperPostPermission();

			expect(result).toBe(true);
		});

		test("should return true if the user role is unexpected", async () => {
			mockGetSession.mockResolvedValue(mockUnexpectedRoleSession);

			const result = await hasDumperPostPermission();

			expect(result).toBe(false);
		});

		test("should return true if the user role is empty", async () => {
			mockGetSession.mockResolvedValue(mockEmptyRoleSession);

			const result = await hasDumperPostPermission();

			expect(result).toBe(false);
		});
	});
});
