import { makeUrl } from "@s-hirano-ist/s-core/articles/entities/article-entity";
import { ArticlesDomainService } from "@s-hirano-ist/s-core/articles/services/articles-domain-service";
import { makeUserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { expect, test, vi } from "vitest";
test("duplication is scoped by owner and independent of the stored lifecycle state", async () => {
	const existsByUrl = vi.fn().mockResolvedValue(false);
	const service = new ArticlesDomainService({ existsByUrl });
	const key = makeUrl("https://example.com");
	const owner = makeUserId("owner");
	await expect(service.ensureNoDuplicate(key, owner)).resolves.toBeUndefined();
	expect(existsByUrl).toHaveBeenCalledWith(key, owner);
	existsByUrl.mockResolvedValue(true);
	await expect(service.ensureNoDuplicate(key, owner)).rejects.toBeInstanceOf(
		DuplicateError,
	);
});
