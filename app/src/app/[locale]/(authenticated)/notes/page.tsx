import { deleteNote } from "@/application-services/notes/delete-note";
import { loadMoreUnexportedNotes } from "@/application-services/notes/load-more-notes";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { NotesStackLoader } from "@/loaders/notes/notes-stack-loader";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { Suspense } from "react";

export default function Page() {
	return (
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
	);
}
