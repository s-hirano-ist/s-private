import { makeUserId } from "@/domains/common/entities/common-entity";
import {
	makeContentTitle,
	makeMarkdown,
} from "@/domains/contents/entities/contents-entity";

export const parseAddContentFormData = (formData: FormData, userId: string) => {
	const title = formData.get("title") as string;
	const markdown = formData.get("markdown") as string;

	return {
		title: makeContentTitle(title),
		markdown: makeMarkdown(markdown),
		userId: makeUserId(userId),
	};
};
