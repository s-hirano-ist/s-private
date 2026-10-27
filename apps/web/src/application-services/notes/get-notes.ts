import type { GetCount, GetPaginatedData } from "@/common/types";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
import type { ContentStatus } from "@s-hirano-ist/s-api-client/models";
import { getBackendClient } from "@/common/backend/server-client";
import { PAGE_SIZE } from "@/common/constants";
import { ApiHttpError } from "@s-hirano-ist/s-api-client";
import { cache } from "react";

const stripMarkdownLinks = (value: string): string => {
	let output = "";
	let cursor = 0;

	while (cursor < value.length) {
		const imageStart = value.indexOf("![", cursor);
		const linkStart = value.indexOf("[", cursor);
		const start =
			imageStart !== -1 && (linkStart === -1 || imageStart < linkStart)
				? imageStart
				: linkStart;

		if (start === -1) {
			return output + value.slice(cursor);
		}

		const labelStart = start === imageStart ? start + 2 : start + 1;
		const separator = value.indexOf("](", labelStart);
		if (separator === -1) {
			return output + value.slice(cursor);
		}

		const end = value.indexOf(")", separator + 2);
		if (end === -1) {
			return output + value.slice(cursor);
		}

		output += value.slice(cursor, start) + value.slice(labelStart, separator);
		cursor = end + 1;
	}

	return output;
};

const page = cache(
	async (
		offset: number,
		status: ContentStatus,
	): Promise<LinkCardStackInitialData> => {
		const response = await (
			await getBackendClient()
		).listNotes({ offset, limit: PAGE_SIZE, status });
		return {
			data: response.data.data.map((note) => {
				const plainText = stripMarkdownLinks(note.markdown)
					.replaceAll(/^#{1,6}\s+/gmu, "")
					.replaceAll(/[*_~`]/gu, "")
					.replaceAll(/\n+/gu, " ")
					.trim();
				return {
					id: note.id,
					key: note.id,
					title: note.title,
					description:
						plainText.length > 150
							? `${plainText.slice(0, 150)}...`
							: plainText,
					primaryBadgeText: new Date(note.createdAt).toLocaleDateString(
						"ja-JP",
					),
					href: `/note/${encodeURIComponent(note.title)}`,
				};
			}),
			totalCount: response.data.totalCount,
		};
	},
);
export const getExportedNotesCount: GetCount = cache(
	async () =>
		(await (await getBackendClient()).countNotes({ status: "EXPORTED" })).data
			.count,
);
export const getUnexportedNotes: GetPaginatedData<LinkCardStackInitialData> = (
	offset,
) => page(offset, "UNEXPORTED");
export const getExportedNotes: GetPaginatedData<LinkCardStackInitialData> = (
	offset,
) => page(offset, "EXPORTED");
export const getNoteByTitle = cache(async (title: string) => {
	try {
		const { data } = await (await getBackendClient()).getNoteByTitle(title);
		return { title: data.title, markdown: data.markdown };
	} catch (error) {
		if (error instanceof ApiHttpError && error.status === 404) return null;
		throw error;
	}
});
