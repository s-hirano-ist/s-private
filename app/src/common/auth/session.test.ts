import { auth, isLocalDevAuthEnabled } from "@/infrastructures/auth/auth";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";

vi.mock("@/infrastructures/auth/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
	isLocalDevAuthEnabled: vi.fn(() => false),
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
		vi.mocked(isLocalDevAuthEnabled).mockReturnValue(false);
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

		test("redirects stale local sessions to local sign-in", async () => {
			vi.mocked(isLocalDevAuthEnabled).mockReturnValue(true);
			getSession.mockResolvedValue(null);
			vi.mocked(redirect).mockImplementation(() => {
				throw new Error("NEXT_REDIRECT");
			});

			await expect(getSelfId()).rejects.toThrow("NEXT_REDIRECT");
			expect(redirect).toHaveBeenCalledWith("/api/sign-in");
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
