import type { ContentName } from "@/types";

export function formatDeleteMessage(id: number, contentName: ContentName) {
	return `【${contentName}】\n\n更新\nID: ${id}`;
}

export function formatCreateNewsMessage({
	title,
	quote,
	url,
	Category,
}: {
	Category: { name: string };
	quote: string | null;
	title: string;
	url: string;
}) {
	return `【NEWS】\n\nコンテンツ\ntitle: ${title} \nquote: ${quote} \nurl: ${url}\ncategory: ${Category.name}\nの登録ができました`;
}

export function formatCreateContentsMessage({
	title,
	markdown,
}: {
	markdown: string;
	title: string;
}) {
	return `【CONTENTS】\n\nコンテンツ\ntitle: ${title} \nquote: ${markdown}\nの登録ができました`;
}

export function formatCreateImageMessage({ fileName }: { fileName: string }) {
	return `【IMAGE】\n\nコンテンツ\nfileName: ${fileName}\nの登録ができました`;
}
