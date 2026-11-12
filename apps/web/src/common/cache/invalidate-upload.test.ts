import { requireAuth } from "@/common/auth/session";
import { invalidateUploadedContent } from "@/common/cache/invalidate-upload";
import { refresh, updateTag } from "next/cache";
import { beforeEach, expect, test, vi } from "vite-plus/test";

vi.mock("@/common/auth/session", () => ({ requireAuth: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

test.each(["images", "books"] as const)(
	"expires %s after authenticating the upload caller",
	async (domain) => {
		await invalidateUploadedContent(domain);
		expect(requireAuth).toHaveBeenCalledOnce();
		expect(updateTag).toHaveBeenCalledExactlyOnceWith(`content:${domain}`);
		expect(refresh).toHaveBeenCalledOnce();
		expect(vi.mocked(requireAuth).mock.invocationCallOrder[0]).toBeLessThan(
			vi.mocked(updateTag).mock.invocationCallOrder[0],
		);
	},
);

test("does not invalidate caches for an unauthenticated caller", async () => {
	vi.mocked(requireAuth).mockRejectedValueOnce(new Error("UNAUTHORIZED"));
	await expect(invalidateUploadedContent("images")).rejects.toThrow(
		"UNAUTHORIZED",
	);
	expect(updateTag).not.toHaveBeenCalled();
	expect(refresh).not.toHaveBeenCalled();
});

test("validates the domain received over the Server Action boundary", async () => {
	await expect(
		invalidateUploadedContent(JSON.parse('"articles"')),
	).rejects.toThrow("Invalid option");
	expect(updateTag).not.toHaveBeenCalled();
});
