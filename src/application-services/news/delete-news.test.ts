import { revalidateTag } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { deleteNews } from "@/application-services/news/delete-news";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import {
	makeId,
	makeStatus,
	makeUserId,
} from "@/domains/common/entities/common-entity";
import { newsCommandRepository } from "@/infrastructures/news/repositories/news-command-repository";

vi.mock("@/infrastructures/news/repositories/news-command-repository", () => ({
	newsCommandRepository: {
		deleteById: vi.fn(),
	},
}));

vi.mock("@/common/error/error-wrapper", () => ({
	wrapServerSideErrorForClient: vi.fn(),
}));

const mockGetSelfId = vi.fn();
const mockHasDumperPostPermission = vi.fn();

vi.mock("@/common/auth/session", () => ({
	getSelfId: () => mockGetSelfId(),
	hasDumperPostPermission: () => mockHasDumperPostPermission(),
}));

describe("deleteNews", () => {
	test("should delete news successfully", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("test-user-id");

		vi.mocked(newsCommandRepository.deleteById).mockResolvedValueOnce(
			undefined,
		);

		const testId = "01234567-89ab-7def-8123-456789abcdef";
		const result = await deleteNews(testId);

		expect(result).toEqual({
			success: true,
			message: "deleted",
		});

		expect(newsCommandRepository.deleteById).toHaveBeenCalledWith(
			makeId(testId),
			makeUserId("test-user-id"),
			makeStatus("UNEXPORTED"),
		);
		expect(revalidateTag).toHaveBeenCalledWith("news_UNEXPORTED_test-user-id");
		expect(revalidateTag).toHaveBeenCalledWith(
			"news_count_UNEXPORTED_test-user-id",
		);
	});

	test("should return error when news not found", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("test-user-id");

		const mockError = new Error("Record not found");
		vi.mocked(newsCommandRepository.deleteById).mockRejectedValue(mockError);
		vi.mocked(wrapServerSideErrorForClient).mockResolvedValue({
			success: false,
			message: "unexpected",
		});

		const testId = "01234567-89ab-7def-8123-456789abcde0";
		const result = await deleteNews(testId);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
		expect(newsCommandRepository.deleteById).toHaveBeenCalledWith(
			makeId(testId),
			makeUserId("test-user-id"),
			makeStatus("UNEXPORTED"),
		);
		expect(wrapServerSideErrorForClient).toHaveBeenCalledWith(mockError);
	});

	test("should call forbidden when user lacks permission", async () => {
		mockHasDumperPostPermission.mockResolvedValue(false);

		const testId = "01234567-89ab-7def-8123-456789abcde1";
		await expect(deleteNews(testId)).rejects.toThrow("FORBIDDEN");
	});
});
