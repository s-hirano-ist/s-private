import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";
import { addNote } from "@/application-services/notes/add-note";
import { deleteNote } from "@/application-services/notes/delete-note";
import {
	loadMoreExportedNotes,
	loadMoreUnexportedNotes,
} from "@/application-services/notes/load-more-notes";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { NoteFormLoader } from "@/loaders/notes/note-form-loader";
import { NotesCounterLoader } from "@/loaders/notes/notes-counter-loader";
import { NotesStackLoader } from "@/loaders/notes/notes-stack-loader";

type Params = Promise<{ layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { layout } = await searchParams;

	switch (layout) {
		case "viewer":
			return (
				<>
					<ErrorPermissionBoundary
						errorCaller="NotesCounter"
						fallback={<div />}
						permissionCheck={hasViewerAdminPermission}
						render={() => NotesCounterLoader({})}
					/>

					<Suspense fallback={<Loading />}>
						<ErrorPermissionBoundary
							errorCaller="NotesStack"
							permissionCheck={hasViewerAdminPermission}
							render={() =>
								NotesStackLoader({
									loadMoreAction: loadMoreExportedNotes,
									variant: "exported",
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
						render={() => NoteFormLoader({ addNote })}
					/>

					<Suspense fallback={<Loading />}>
						<ErrorPermissionBoundary
							errorCaller="NotesStack"
							permissionCheck={hasViewerAdminPermission}
							render={() =>
								NotesStackLoader({
									deleteAction: deleteNote,
									loadMoreAction: loadMoreUnexportedNotes,
									variant: "unexported",
								})
							}
						/>
					</Suspense>
				</>
			);
	}
}
