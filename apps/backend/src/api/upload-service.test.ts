import type { MobileDeps } from "@s-hirano-ist/s-application/mobile/deps";
import { createUploads } from "@s-hirano-ist/s-application/mobile/uploads";
import { createUploadService } from "s-private-backend/api/upload-service";
import { expect, test, vi } from "vitest";
vi.mock("@s-hirano-ist/s-application/mobile/uploads", () => ({
	createUploads: vi.fn(),
}));
test("validates Application output at the HTTP boundary and delegates guarded creation", async () => {
	const value = {
		uploadId: "0199cb00-0000-7000-8000-000000000001",
		operationId: "0199cb00-0000-7000-8000-000000000002",
		chunkSize: 1048576 as const,
		receivedParts: [0],
		expiresAt: new Date().toISOString(),
	};
	const start = vi.fn().mockResolvedValue(value);
	vi.mocked(createUploads).mockReturnValue({ start } as unknown as ReturnType<
		typeof createUploads
	>);
	const media = vi.fn();
	const service = createUploadService(
		{} as Pick<MobileDeps, "uploads" | "chunks">,
		{ media },
		{ captureException: vi.fn() },
	);
	const input = {
		operationId: value.operationId,
		domain: "images" as const,
		contentType: "image/png" as const,
		fileSize: 3,
		metadata: { filename: "image.png" },
	};
	expect(await service.start("owner", input)).toEqual(value);
	const guard = vi.fn();
	const file = new File(["png"], "image.png");
	await vi.mocked(createUploads).mock.calls[0][1]("owner", input, file, guard);
	expect(media).toHaveBeenCalledWith("owner", input, file, guard);
	start.mockResolvedValue({ ...value, chunkSize: 1 });
	await expect(service.start("owner", input)).rejects.toThrow("1048576");
});
