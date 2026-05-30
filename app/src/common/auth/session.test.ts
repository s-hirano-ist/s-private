import type { Session } from "next-auth";
import { auth } from "@/infrastructures/auth/auth-provider";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";

vi.mock("@/infrastructures/auth/auth-provider", () => ({
	auth: vi.fn(),
}));

import { getSelfId, requireAuth } from "@/common/auth/session";

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

			const result = await getSelfId();

			expect(auth).toHaveBeenCalledTimes(1);
			expect(result).toBe("2");
		});

		test("should throw Unauthorized if not authenticated", async () => {
			(auth as Mock).mockResolvedValue(null);

			await expect(getSelfId()).rejects.toThrow("UNAUTHORIZED");
			expect(auth).toHaveBeenCalledTimes(1);
		});
	});

	describe("requireAuth", () => {
		test("should resolve when authenticated", async () => {
			(auth as Mock).mockResolvedValue(mockSession("1"));

			await expect(requireAuth()).resolves.toBeUndefined();
			expect(auth).toHaveBeenCalledTimes(1);
		});

		test("should throw Unauthorized if not authenticated", async () => {
			(auth as Mock).mockResolvedValue(null);

			await expect(requireAuth()).rejects.toThrow("UNAUTHORIZED");
			expect(auth).toHaveBeenCalledTimes(1);
		});
	});
});
