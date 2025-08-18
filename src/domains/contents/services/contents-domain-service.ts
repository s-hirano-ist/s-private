import "server-only";
import { DuplicateError } from "@/common/error/error-classes";
import type { UserId } from "@/domains/common/entities/common-entity";
import type { ContentTitle } from "@/domains/contents/entities/contents-entity";
import type { IContentsQueryRepository } from "@/domains/contents/types";

export class ContentsDomainService {
	constructor(
		private readonly contentsQueryRepository: IContentsQueryRepository,
	) {}

	public async ensureNoDuplicate(
		title: ContentTitle,
		userId: UserId,
	): Promise<void> {
		const exists = await this.contentsQueryRepository.findByTitle(
			title,
			userId,
		);
		if (exists) {
			throw new DuplicateError();
		}
	}
}
