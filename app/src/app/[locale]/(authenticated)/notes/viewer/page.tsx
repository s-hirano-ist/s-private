import { loadMoreExportedNotes } from "@/application-services/notes/load-more-notes";
import { renderContentListPage } from "@/components/common/layouts/content-list-page-server";
import { NotesCounterLoader } from "@/loaders/notes/notes-counter-loader";
import { NotesStackLoader } from "@/loaders/notes/notes-stack-loader";

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
				}),
		},
	});
}
