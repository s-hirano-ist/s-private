import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { deleteNews } from "@/features/news/actions/delete-news";
import { newsCommandRepository } from "@/infrastructure/news/repositories/news-command-repository";

vi.mock("@/o11y/server", () => ({
	serverLogger: {
		info: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("@/infrastructure/news/repositories/news-command-repository", () => ({
	newsCommandRepository: {
		deleteById: vi.fn(),
	},
}));

const mockGetSelfId = vi.fn();
const mockHasDumperPostPermission = vi.fn();

vi.mock("@/utils/auth/session", () => ({
	getSelfId: () => mockGetSelfId(),
	hasDumperPostPermission: () => mockHasDumperPostPermission(),
}));

describe("deleteNews", () => {
	test("should delete news successfully", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");

		vi.mocked(newsCommandRepository.deleteById).mockResolvedValueOnce();

		const result = await deleteNews("1");

		expect(result).toEqual({
			success: true,
			message: "deleted",
		});

		expect(newsCommandRepository.deleteById).toHaveBeenCalledWith(
			"1",
			"1",
			"UNEXPORTED",
		);
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
	});

	test("should return error when news not found", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");

		vi.mocked(newsCommandRepository.deleteById).mockRejectedValue(
			new Error("Record not found"),
		);

		const result = await deleteNews("999");

		expect(result.success).toBe(false);
		expect(result.message).toBe("unexpected");
		expect(newsCommandRepository.deleteById).toHaveBeenCalledWith(
			"999",
			"1",
			"UNEXPORTED",
		);
	});
});
