import type { Session } from "next-auth";
import { auth } from "@/infrastructures/auth/auth-provider";
import { usersQueryRepository } from "@/infrastructures/users/repositories/users-query-repository";
import { makeRole } from "@s-hirano-ist/s-core/users/entities/user-entity";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";

vi.mock("@/infrastructures/auth/auth-provider", () => ({
	auth: vi.fn(),
}));

vi.mock("@/infrastructures/users/repositories/users-query-repository", () => ({
	usersQueryRepository: {
		findRolesById: vi.fn(),
	},
}));

import {
	getSelfId,
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";

const mockSession = (id: string): Session => ({
	user: { id },
	expires: "2025-01-01",
});

describe("session utilities", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getSelfId", () => {
		test("should return the user ID from the session", async () => {
			(auth as Mock).mockResolvedValue(mockSession("2"));
			vi.mocked(usersQueryRepository.findRolesById).mockResolvedValue([]);

			const result = await getSelfId();

			expect(auth).toHaveBeenCalledTimes(1);
			expect(result).toBe("2");
		});
	});

	describe("hasViewerAdminPermission", () => {
		test("should return true if the user has the viewer role", async () => {
			(auth as Mock).mockResolvedValue(mockSession("2"));
			vi.mocked(usersQueryRepository.findRolesById).mockResolvedValue([
				makeRole("VIEWER"),
			]);

			expect(await hasViewerAdminPermission()).toBe(true);
		});

		test("should return true if the user has viewer and dumper roles", async () => {
			(auth as Mock).mockResolvedValue(mockSession("3"));
			vi.mocked(usersQueryRepository.findRolesById).mockResolvedValue([
				makeRole("DUMPER"),
				makeRole("VIEWER"),
			]);

			expect(await hasViewerAdminPermission()).toBe(true);
		});

		test("should return false if the user has only the dumper role", async () => {
			(auth as Mock).mockResolvedValue(mockSession("1"));
			vi.mocked(usersQueryRepository.findRolesById).mockResolvedValue([
				makeRole("DUMPER"),
			]);

			expect(await hasViewerAdminPermission()).toBe(false);
		});

		test("should return false if the user has no roles", async () => {
			(auth as Mock).mockResolvedValue(mockSession("4"));
			vi.mocked(usersQueryRepository.findRolesById).mockResolvedValue([]);

			expect(await hasViewerAdminPermission()).toBe(false);
		});

		test("should throw Unauthorized if not authenticated", async () => {
			(auth as Mock).mockResolvedValue(null);

			await expect(hasViewerAdminPermission).rejects.toThrow("UNAUTHORIZED");
			expect(auth).toHaveBeenCalledTimes(1);
		});
	});

	describe("hasDumperPostPermission", () => {
		test("should return true if the user has the dumper role", async () => {
			(auth as Mock).mockResolvedValue(mockSession("1"));
			vi.mocked(usersQueryRepository.findRolesById).mockResolvedValue([
				makeRole("DUMPER"),
			]);

			expect(await hasDumperPostPermission()).toBe(true);
		});

		test("should return true if the user has dumper and viewer roles", async () => {
			(auth as Mock).mockResolvedValue(mockSession("3"));
			vi.mocked(usersQueryRepository.findRolesById).mockResolvedValue([
				makeRole("DUMPER"),
				makeRole("VIEWER"),
			]);

			expect(await hasDumperPostPermission()).toBe(true);
		});

		test("should return false if the user has only the viewer role", async () => {
			(auth as Mock).mockResolvedValue(mockSession("2"));
			vi.mocked(usersQueryRepository.findRolesById).mockResolvedValue([
				makeRole("VIEWER"),
			]);

			expect(await hasDumperPostPermission()).toBe(false);
		});

		test("should return false if the user has no roles", async () => {
			(auth as Mock).mockResolvedValue(mockSession("4"));
			vi.mocked(usersQueryRepository.findRolesById).mockResolvedValue([]);

			expect(await hasDumperPostPermission()).toBe(false);
		});
	});
});
