import "server-only";
import { DuplicateError } from "@/common/error/error-classes";
import type { INewsQueryRepository } from "@/domains/news/types";

export class NewsDomainService {
	constructor(private readonly newsQueryRepository: INewsQueryRepository) {}

	public async ensureNoDuplicate(url: string, userId: string): Promise<void> {
		const exists = await this.newsQueryRepository.findByUrl(url, userId);
		if (exists !== null) {
			throw new DuplicateError();
		}
	}
}
