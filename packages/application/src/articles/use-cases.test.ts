import {
	createArticle,
	deleteArticle,
	parseArticleInput,
	type CreateArticleDeps,
} from "@s-hirano-ist/s-application/articles/use-cases";
import { makeArticleTitle } from "@s-hirano-ist/s-core/articles/entities/article-entity";
import {
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { describe, expect, test, vi } from "vite-plus/test";

function dependencies() {
	const ensureNoDuplicate = vi
		.fn<
			ReturnType<
				CreateArticleDeps["domainServiceFactory"]["createArticlesDomainService"]
			>["ensureNoDuplicate"]
		>()
		.mockResolvedValue(undefined);
	const resolveOrCreate = vi.fn(async () => makeId());
	const create = vi
		.fn<CreateArticleDeps["commandRepository"]["create"]>()
		.mockResolvedValue(undefined);
	const deleteById = vi
		.fn<CreateArticleDeps["commandRepository"]["deleteById"]>()
		.mockResolvedValue({ title: makeArticleTitle("Title") });
	const dispatch = vi
		.fn<CreateArticleDeps["eventDispatcher"]["dispatch"]>()
		.mockResolvedValue(undefined);
	const deps: CreateArticleDeps = {
		commandRepository: { create, deleteById },
		eventDispatcher: { dispatch },
		domainServiceFactory: {
			createArticlesDomainService: () => ({ ensureNoDuplicate }),
			createCategoryService: () => ({ resolveOrCreate }),
		},
	};
	return {
		deps,
		ensureNoDuplicate,
		resolveOrCreate,
		create,
		deleteById,
		dispatch,
	};
}
const input = {
	title: "Title",
	url: "https://example.com",
	quote: "Quote",
	category: "Tech",
};

describe("Backend article use cases", () => {
	test("keeps owner context in duplicate checks, category resolution, persistence and events", async () => {
		const fixture = dependencies();
		const alice = parseArticleInput(input, makeUserId("alice"));
		const bob = parseArticleInput(input, makeUserId("bob"));
		const results = await Promise.all([
			createArticle(alice, fixture.deps),
			createArticle(bob, fixture.deps),
		]);
		expect(results[0].id).not.toBe(results[1].id);
		expect(fixture.ensureNoDuplicate.mock.calls).toEqual([
			[alice.url, alice.userId],
			[bob.url, bob.userId],
		]);
		expect(fixture.resolveOrCreate).toHaveBeenCalledWith(
			alice.categoryName,
			alice.userId,
		);
		expect(fixture.resolveOrCreate).toHaveBeenCalledWith(
			bob.categoryName,
			bob.userId,
		);
		expect(
			fixture.create.mock.calls.map(([value]) => value.userId).toSorted(),
		).toEqual(["alice", "bob"]);
		expect(
			fixture.dispatch.mock.calls
				.map(([event]) => event.metadata.userId)
				.toSorted(),
		).toEqual(["alice", "bob"]);
	});
	test("does not create a category, content or event after a duplicate", async () => {
		const fixture = dependencies();
		fixture.ensureNoDuplicate.mockRejectedValue(new DuplicateError());
		await expect(
			createArticle(
				parseArticleInput(input, makeUserId("alice")),
				fixture.deps,
			),
		).rejects.toBeInstanceOf(DuplicateError);
		expect(fixture.resolveOrCreate).not.toHaveBeenCalled();
		expect(fixture.create).not.toHaveBeenCalled();
		expect(fixture.dispatch).not.toHaveBeenCalled();
	});
	test("validates raw input using the domain value objects", () => {
		expect(() =>
			parseArticleInput({ ...input, url: "invalid" }, makeUserId("alice")),
		).toThrow(Error);
		expect(() =>
			parseArticleInput(
				{ ...input, category: "x".repeat(17) },
				makeUserId("alice"),
			),
		).toThrow(Error);
	});
	test("deletes only an owner's unexported content and emits no event if persistence refuses", async () => {
		const fixture = dependencies();
		const id = makeId();
		const owner = makeUserId("alice");
		fixture.deleteById.mockRejectedValueOnce(new Error("not deletable"));
		await expect(deleteArticle(id, owner, fixture.deps)).rejects.toThrow(
			"not deletable",
		);
		expect(fixture.dispatch).not.toHaveBeenCalled();
		await deleteArticle(id, owner, fixture.deps);
		expect(fixture.deleteById).toHaveBeenCalledWith(
			id,
			owner,
			makeUnexportedStatus(),
		);
		expect(fixture.dispatch).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				metadata: expect.objectContaining({ userId: owner }),
			}),
		);
	});
});
