import { revalidateTag } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { deleteArticle } from "@/application-services/articles/delete-article";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import {
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "@/domains/common/entities/common-entity";
import { articlesCommandRepository } from "@/infrastructures/articles/repositories/articles-command-repository";

vi.mock(
	"@/infrastructures/articles/repositories/articles-command-repository",
	() => ({
		articlesCommandRepository: {
			deleteById: vi.fn(),
		},
	}),
);

vi.mock("@/common/error/error-wrapper", () => ({
	wrapServerSideErrorForClient: vi.fn(),
}));

const mockGetSelfId = vi.fn();
const mockHasDumperPostPermission = vi.fn();

vi.mock("@/common/auth/session", () => ({
	getSelfId: () => mockGetSelfId(),
	hasDumperPostPermission: () => mockHasDumperPostPermission(),
}));

describe("deleteArticle", () => {
	test("should delete article successfully", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("test-user-id");

		vi.mocked(articlesCommandRepository.deleteById).mockResolvedValueOnce(
			undefined,
		);

		const testId = "01234567-89ab-7def-8123-456789abcdef";
		const result = await deleteArticle(testId);

		expect(result).toEqual({
			success: true,
			message: "deleted",
		});

		expect(articlesCommandRepository.deleteById).toHaveBeenCalledWith(
			makeId(testId),
			makeUserId("test-user-id"),
			"UNEXPORTED",
		);
		const status = makeUnexportedStatus();
		expect(revalidateTag).toHaveBeenCalledWith(
			buildContentCacheTag("articles", status, "test-user-id"),
		);
		expect(revalidateTag).toHaveBeenCalledWith(
			buildCountCacheTag("articles", status, "test-user-id"),
		);
	});

	test("should return error when article not found", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("test-user-id");

		const mockError = new Error("Record not found");
		vi.mocked(articlesCommandRepository.deleteById).mockRejectedValue(
			mockError,
		);
		vi.mocked(wrapServerSideErrorForClient).mockResolvedValue({
			success: false,
			message: "unexpected",
		});

		const testId = "01234567-89ab-7def-8123-456789abcde0";
		const result = await deleteArticle(testId);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
		expect(articlesCommandRepository.deleteById).toHaveBeenCalledWith(
			makeId(testId),
			makeUserId("test-user-id"),
			"UNEXPORTED",
		);
		expect(wrapServerSideErrorForClient).toHaveBeenCalledWith(mockError);
	});

	test("should call forbidden when user lacks permission", async () => {
		mockHasDumperPostPermission.mockResolvedValue(false);

		const testId = "01234567-89ab-7def-8123-456789abcde1";
		await expect(deleteArticle(testId)).rejects.toThrow("FORBIDDEN");
	});
});
