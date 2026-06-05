import { auth } from "@/infrastructures/auth/auth";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";

vi.mock("@/infrastructures/auth/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

import { getSelfId, requireAuth } from "@/common/auth/session";

const getSession = auth.api.getSession as unknown as Mock;

const mockSession = (id: string) => ({
	session: {
		id: "session-id",
		token: "token",
		userId: id,
		expiresAt: new Date("2099-01-01"),
		createdAt: new Date("2025-01-01"),
		updatedAt: new Date("2025-01-01"),
	},
	user: {
		id,
		name: "Test User",
		email: "test@example.com",
		emailVerified: true,
		createdAt: new Date("2025-01-01"),
		updatedAt: new Date("2025-01-01"),
	},
});

describe("session utilities", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getSelfId", () => {
		test("should return the user ID from the session", async () => {
			getSession.mockResolvedValue(mockSession("2"));

			const result = await getSelfId();

			expect(getSession).toHaveBeenCalledTimes(1);
			expect(result).toBe("2");
		});

		test("should throw Unauthorized if not authenticated", async () => {
			getSession.mockResolvedValue(null);

			await expect(getSelfId()).rejects.toThrow("UNAUTHORIZED");
			expect(getSession).toHaveBeenCalledTimes(1);
		});
	});

	describe("requireAuth", () => {
		test("should resolve when authenticated", async () => {
			getSession.mockResolvedValue(mockSession("1"));

			await expect(requireAuth()).resolves.toBeUndefined();
			expect(getSession).toHaveBeenCalledTimes(1);
		});

		test("should throw Unauthorized if not authenticated", async () => {
			getSession.mockResolvedValue(null);

			await expect(requireAuth()).rejects.toThrow("UNAUTHORIZED");
			expect(getSession).toHaveBeenCalledTimes(1);
		});
	});
});
