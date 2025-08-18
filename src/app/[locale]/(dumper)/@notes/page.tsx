import { Suspense } from "react";
import { addNote } from "@/application-services/notes/add-note";
import { deleteNote } from "@/application-services/notes/delete-note";
import {
	getExportedNotes,
	getExportedNotesCount,
	getUnexportedNotes,
} from "@/application-services/notes/get-notes";
import {
	loadMoreExportedNotes,
	loadMoreUnexportedNotes,
} from "@/application-services/notes/get-notes-from-client";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import Loading from "@/components/common/display/loading";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { LazyTabContent } from "@/components/common/layouts/lazy-tab-content";
import { NoteForm } from "@/components/notes/server/note-form";
import { NotesCounter } from "@/components/notes/server/notes-counter";
import { NotesStack } from "@/components/notes/server/notes-stack";

type Params = Promise<{ tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { tab, layout } = await searchParams;

	// Only render if this tab is active or no tab is specified
	if (tab && tab !== "notes") return null;

	const content = (() => {
		switch (layout) {
			case "viewer":
				return (
					<>
						<ErrorPermissionBoundary
							errorCaller="NotesCounter"
							permissionCheck={hasViewerAdminPermission}
							render={() =>
								NotesCounter({ getNotesCount: getExportedNotesCount })
							}
						/>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="NotesStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									NotesStack({
										getNotes: getExportedNotes,
										loadMoreAction: loadMoreExportedNotes,
									})
								}
							/>
						</Suspense>
					</>
				);
			default:
				return (
					<>
						<ErrorPermissionBoundary
							errorCaller="NoteForm"
							permissionCheck={hasDumperPostPermission}
							render={() => NoteForm({ addNote })}
						/>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="NotesStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									NotesStack({
										getNotes: getUnexportedNotes,
										loadMoreAction: loadMoreUnexportedNotes,
										deleteNote,
									})
								}
							/>
						</Suspense>
					</>
				);
		}
	})();

	return (
		<LazyTabContent fallback={<Loading />} tabName="notes">
			{content}
		</LazyTabContent>
	);
}
