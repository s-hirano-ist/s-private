import { makeISBN } from "@s-hirano-ist/s-core/books/entities/book-entity";
import { BooksDomainService } from "@s-hirano-ist/s-core/books/services/books-domain-service";
import { makeUserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { expect, test, vi } from "vitest";
test("duplication is scoped by owner and independent of the stored lifecycle state", async () => {
	const existsByISBN = vi.fn().mockResolvedValue(false);
	const service = new BooksDomainService({ existsByISBN });
	const key = makeISBN("9780306406157");
	const owner = makeUserId("owner");
	await expect(service.ensureNoDuplicate(key, owner)).resolves.toBeUndefined();
	expect(existsByISBN).toHaveBeenCalledWith(key, owner);
	existsByISBN.mockResolvedValue(true);
	await expect(service.ensureNoDuplicate(key, owner)).rejects.toBeInstanceOf(
		DuplicateError,
	);
});
