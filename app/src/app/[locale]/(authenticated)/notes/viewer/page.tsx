import { loadMoreExportedNotes } from "@/application-services/notes/load-more-notes";
import { CounterBadgeSkeleton } from "@/components/common/display/counter-badge";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { NotesCounterLoader } from "@/loaders/notes/notes-counter-loader";
import { NotesStackLoader } from "@/loaders/notes/notes-stack-loader";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { Suspense } from "react";

export default function Page() {
	return (
		<>
			<Suspense fallback={<CounterBadgeSkeleton />}>
				<ErrorBoundary
					errorCaller="NotesCounter"
					fallback={<div />}
					render={() => NotesCounterLoader({})}
				/>
			</Suspense>

			<Suspense fallback={<Loading />}>
				<ErrorBoundary
					errorCaller="NotesStack"
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
}
