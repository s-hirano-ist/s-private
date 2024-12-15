import type { ContentName, Status } from "@/features/dump/types";
import type { Role, Scope } from "@prisma/client";

export function formatDeleteMessage(id: number, contentName: ContentName) {
	return `【${contentName}】\n\n更新\nID: ${id}`;
}

export function formatChangeStatusMessage(
	status: Status,
	contentName: ContentName,
) {
	return `【${contentName}】\n\n更新\n未処理: ${status.unexported}\n直近更新: ${status.recentlyUpdated}\n確定: ${status.exported}`;
}

export function formatCreateCategoryMessage(
	category: string,
	contentName: ContentName,
) {
	return `【${contentName}】\n\nカテゴリー\n${category}\nの登録ができました`;
}

export function formatCreateNewsMessage({
	title,
	quote,
	url,
	Category,
}: {
	title: string;
	quote: string | null;
	url: string;
	Category: { name: string };
}) {
	return `【NEWS】\n\nコンテンツ\ntitle: ${title} \nquote: ${quote} \nurl: ${url}\ncategory: ${Category.name}\nの登録ができました`;
}

export function formatCreateContentsMessage({
	title,
	quote,
	url,
}: { title: string; quote: string | null; url: string }) {
	return `【CONTENTS】\n\nコンテンツ\ntitle: ${title} \nquote: ${quote} \nurl: ${url}\nの登録ができました`;
}

export function formatCreateImageMessage({ fileName }: { fileName: string }) {
	return `【IMAGE】\n\nコンテンツ\nfileName: ${fileName}\nの登録ができました`;
}

export function formatUpdateScopeMessage(scope: Scope) {
	return `【SCOPE】\n\nscope: ${scope}\nに変更しました`;
}

export function formatUpdateRoleMessage(role: Role) {
	return `【ROLE】\n\nrole: ${role}\nに変更しました`;
}
