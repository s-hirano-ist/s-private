import { ImagesDomainService } from "@s-hirano-ist/s-core/images/services/images-domain-service";
import { makeUserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { makePath } from "@s-hirano-ist/s-core/shared-kernel/entities/file-entity";
import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { expect, test, vi } from "vitest";
test("duplication is scoped by owner and independent of the stored lifecycle state", async () => {
	const existsByPath = vi.fn().mockResolvedValue(false);
	const service = new ImagesDomainService({ existsByPath });
	const key = makePath("image.png", false);
	const owner = makeUserId("owner");
	await expect(service.ensureNoDuplicate(key, owner)).resolves.toBeUndefined();
	expect(existsByPath).toHaveBeenCalledWith(key, owner);
	existsByPath.mockResolvedValue(true);
	await expect(service.ensureNoDuplicate(key, owner)).rejects.toBeInstanceOf(
		DuplicateError,
	);
});
