import { UnauthorizedError } from "@/error-classes";
import { auth } from "@/features/auth/utils/auth";
import {
	checkSelfAuthOrThrow,
	getUserId,
} from "@/features/auth/utils/get-session";
import { type Mock, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/utils/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("@/features/auth/utils/role", () => ({
	hasContentsPermission: vi.fn(),
	hasDumperPermission: vi.fn(),
}));

describe("get-session utilities", () => {
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

	describe("getUserId", () => {
		it("should return the user ID from the session", async () => {
			const mockSession = { user: { id: "123", role: "admin" } };
			(auth as Mock).mockResolvedValue(mockSession);

			const result = await getUserId();

			expect(auth).toHaveBeenCalledTimes(1);
			expect(result).toBe("123");
		});
	});
});
