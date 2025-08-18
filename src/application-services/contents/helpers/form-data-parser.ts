import { getFormDataString } from "@/common/utils/form-data-utils";
import { makeUserId } from "@/domains/common/entities/common-entity";
import {
	makeContentTitle,
	makeMarkdown,
} from "@/domains/contents/entities/contents-entity";

export const parseAddContentFormData = (formData: FormData, userId: string) => {
	const title = getFormDataString(formData, "title");
	const markdown = getFormDataString(formData, "markdown");

	return {
		title: makeContentTitle(title),
		markdown: makeMarkdown(markdown),
		userId: makeUserId(userId),
	};
};
