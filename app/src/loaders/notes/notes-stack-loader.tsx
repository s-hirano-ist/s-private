import "server-only";

import {
	getExportedNotes,
	getUnexportedNotes,
} from "@/application-services/notes/get-notes";
import { NotesStack } from "@/components/notes/server/notes-stack";
import type { PaginatedLinkCardLoaderProps } from "@/loaders/types";

export type NotesStackLoaderProps = PaginatedLinkCardLoaderProps & {
	variant: "exported" | "unexported";
};

export async function NotesStackLoader({
	variant,
	deleteAction,
	loadMoreAction,
}: NotesStackLoaderProps) {
	const getData =
		variant === "exported" ? getExportedNotes : getUnexportedNotes;

	const initialData = await getData(0);

	return (
		<NotesStack
			deleteAction={deleteAction}
			initialData={initialData}
			loadMoreAction={loadMoreAction}
		/>
	);
}
