import { deleteNote } from "@/application-services/notes/delete-note";
import { loadMoreUnexportedNotes } from "@/application-services/notes/load-more-notes";
import { renderContentListPage } from "@/components/common/layouts/content-list-page-server";
import { NotesStackLoader } from "@/loaders/notes/notes-stack-loader";

export default function Page() {
	return renderContentListPage({
		stack: {
			errorCaller: "NotesStack",
			render: () =>
				NotesStackLoader({
					deleteAction: deleteNote,
					loadMoreAction: loadMoreUnexportedNotes,
					variant: "unexported",
				}),
		},
	});
}
