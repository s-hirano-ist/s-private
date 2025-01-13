import { checkSelfAuthOrThrow } from "@/features/auth/utils/get-session";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/features/auth/utils/role";
import { type Mock, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/utils/get-session", () => ({
	checkSelfAuthOrThrow: vi.fn(),
}));

describe("role utilities", () => {
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
