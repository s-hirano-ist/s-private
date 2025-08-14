import "server-only";
import { v7 as uuidv7 } from "uuid";
import type { IContentsQueryRepository } from "@/domains/contents/types";
import {
	DuplicateError,
	InvalidFormatError,
} from "@/utils/error/error-classes";
import {
	type ContentsEntity,
	contentsEntity,
} from "../entities/contents-entity";

export async function validateContents(
	formData: FormData,
	userId: string,
	contentsQueryRepository: IContentsQueryRepository,
): Promise<ContentsEntity> {
	const generatedId = uuidv7();

	const formValues = {
		title: formData.get("title"),
		markdown: formData.get("markdown"),
		userId,
		id: generatedId,
	};

	const contentsValidatedFields = contentsEntity.safeParse(formValues);
	if (!contentsValidatedFields.success) throw new InvalidFormatError();

	const response = await contentsQueryRepository.findByTitle(
		contentsValidatedFields.data.title,
		userId,
	);
	if (response !== null) throw new DuplicateError();

	return contentsValidatedFields.data;
}
