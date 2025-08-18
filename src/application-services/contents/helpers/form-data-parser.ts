import {
	makeMarkdown,
	makeTitle,
} from "@/domains/contents/entities/contents-entity";

export type AddContentFormData = {
	title: ReturnType<typeof makeTitle>;
	markdown: ReturnType<typeof makeMarkdown>;
};

export const parseAddContentFormData = (
	formData: FormData,
): AddContentFormData => {
	const title = formData.get("title") as string;
	const markdown = formData.get("markdown") as string;

	return {
		title: makeTitle(title),
		markdown: makeMarkdown(markdown),
	};
};
