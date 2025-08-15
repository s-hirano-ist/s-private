import "server-only";
import {
	DuplicateError,
	InvalidFormatError,
} from "@/common/error/error-classes";
import type { IContentsQueryRepository } from "@/domains/contents/types";
import {
	type ContentsFormSchema,
	contentsFormSchema,
} from "../entities/contents-entity";

export class ContentsDomainService {
	constructor(
		private readonly contentsQueryRepository: IContentsQueryRepository,
	) {}

	public async prepareNewContents(
		formData: FormData,
		userId: string,
	): Promise<ContentsFormSchema> {
		const formValues = {
			title: formData.get("title") as string,
			markdown: formData.get("markdown") as string,
			userId,
			status: "UNEXPORTED",
		} satisfies Omit<ContentsFormSchema, "id">;

		// Use the complete schema which includes auto-generated ID
		const contentsValidatedFields = contentsFormSchema.safeParse(formValues);
		if (!contentsValidatedFields.success) throw new InvalidFormatError();

		// check duplicate
		const exists = await this.contentsQueryRepository.findByTitle(
			contentsValidatedFields.data.title,
			userId,
		);
		if (exists !== null) throw new DuplicateError();

		return contentsValidatedFields.data;
	}
}
