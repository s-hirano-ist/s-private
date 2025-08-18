import "server-only";
import { DomainError, Result } from "@/domains/common/value-objects";
import type { IContentsQueryRepository } from "@/domains/contents/types";
import {
	type ContentAggregate,
	ContentEntity,
	type ContentsFormSchema,
	contentsFormSchema,
	type UserId,
} from "../entities/contents-entity";
import { ContentTitle } from "../value-objects";

// Reader monad pattern for dependency injection
export type ContentsDomainServiceDeps = {
	readonly contentsQueryRepository: IContentsQueryRepository;
};

export type ContentsDomainServiceReader<T> = (
	deps: ContentsDomainServiceDeps,
) => Promise<Result<T, DomainError>>;

// Pure domain functions
export const contentsDomainOperations = {
	validateNewContent: async (
		formData: FormData,
		userId: UserId,
		deps: ContentsDomainServiceDeps,
	): Promise<Result<ContentAggregate, DomainError>> => {
		// Parse form data into domain object
		const contentDataResult = ContentEntity.fromFormData(formData, userId);
		if (contentDataResult.isFailure) {
			return contentDataResult;
		}

		// Check for duplicates
		const title = contentDataResult.value.title;
		const duplicateCheckResult = await checkTitleDuplicate(title, userId, deps);
		if (duplicateCheckResult.isFailure) {
			return duplicateCheckResult;
		}

		// Create content entity
		return ContentEntity.create(contentDataResult.value);
	},

	updateContentStatus: (
		content: ContentAggregate,
		newStatus: "UNEXPORTED" | "EXPORTED",
	): Result<ContentAggregate, DomainError> => {
		if (content.status === newStatus) {
			return Result.failure(
				DomainError.businessRule(
					"Content is already in the requested status",
					"status_unchanged",
					{ currentStatus: content.status, requestedStatus: newStatus },
				),
			);
		}

		return Result.success(ContentEntity.updateStatus(content, newStatus));
	},
};

// Helper functions
const checkTitleDuplicate = async (
	title: ContentTitle,
	userId: UserId,
	deps: ContentsDomainServiceDeps,
): Promise<Result<void, DomainError>> => {
	const existingContentId = await deps.contentsQueryRepository.findByTitle(
		ContentTitle.unwrap(title),
		userId,
	);

	if (existingContentId !== null) {
		return Result.failure(
			DomainError.duplicate(
				"A content with this title already exists",
				"content",
				ContentTitle.unwrap(title),
			),
		);
	}

	return Result.success(undefined);
};

// Legacy class-based service for backward compatibility
export class ContentsDomainService {
	constructor(
		private readonly contentsQueryRepository: IContentsQueryRepository,
	) {}

	public async prepareNewContents(
		formData: FormData,
		userId: string,
	): Promise<ContentsFormSchema> {
		const deps: ContentsDomainServiceDeps = {
			contentsQueryRepository: this.contentsQueryRepository,
		};

		const result = await contentsDomainOperations.validateNewContent(
			formData,
			userId,
			deps,
		);

		if (result.isFailure) {
			// Convert domain errors to legacy exceptions for backward compatibility
			switch (result.error.type) {
				case "ValidationError":
					throw new Error("InvalidFormatError");
				case "DuplicateError":
					throw new Error("DuplicateError");
				default:
					throw new Error(result.error.message);
			}
		}

		// Convert to legacy format
		return {
			title: ContentTitle.unwrap(result.value.title),
			markdown: result.value.markdown as any, // Type coercion for legacy compatibility
			userId: result.value.userId,
			id: result.value.id,
			status: result.value.status,
		};
	}
}
