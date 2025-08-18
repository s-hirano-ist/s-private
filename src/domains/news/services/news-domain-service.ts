import "server-only";
import { DuplicateError } from "@/common/error/error-classes";
import type { UserId } from "@/domains/common/entities/common-entity";
import type { INewsQueryRepository } from "@/domains/news/repositories/news-query-repository.interface";
import type { Url } from "../entities/news-entity";

export class NewsDomainService {
	constructor(private readonly newsQueryRepository: INewsQueryRepository) {}

	public async ensureNoDuplicate(url: Url, userId: UserId): Promise<void> {
		const exists = await this.newsQueryRepository.findByUrl(url, userId);
		if (exists !== null) {
			throw new DuplicateError();
		}
	}
}
