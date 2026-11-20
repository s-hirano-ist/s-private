import { deleteNote } from "@/application-services/notes/delete-note";
import { loadMoreExportedNotes } from "@/application-services/notes/load-more-notes";
import { renderContentListPage } from "@/components/common/layouts/content-list-page-server";
import { NotesCounterLoader } from "@/loaders/notes/notes-counter-loader";
import { NotesStackLoader } from "@/loaders/notes/notes-stack-loader";

// Keep ordinary client navigations fresh for the same 60s as private content.
export const unstable_dynamicStaleTime = 60;

export default function Page() {
	return renderContentListPage({
		counter: {
			errorCaller: "NotesCounter",
			render: () => NotesCounterLoader({}),
		},
		stack: {
			errorCaller: "NotesStack",
			render: () =>
				NotesStackLoader({
					loadMoreAction: loadMoreExportedNotes,
					variant: "exported",
					deleteAction: deleteNote,
				}),
		},
	});
}
