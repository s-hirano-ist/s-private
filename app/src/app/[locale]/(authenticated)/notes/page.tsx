import { addNote } from "@/application-services/notes/add-note";
import { deleteNote } from "@/application-services/notes/delete-note";
import { loadMoreUnexportedNotes } from "@/application-services/notes/load-more-notes";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { NoteFormLoader } from "@/loaders/notes/note-form-loader";
import { NotesStackLoader } from "@/loaders/notes/notes-stack-loader";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { Suspense } from "react";

export default function Page() {
	return (
		<>
			<Suspense fallback={<Loading />}>
				<ErrorBoundary
					errorCaller="NoteForm"
					render={() => NoteFormLoader({ addNote })}
				/>
			</Suspense>

			<Suspense fallback={<Loading />}>
				<ErrorBoundary
					errorCaller="NotesStack"
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
