import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";
import { loadMoreExportedNotes } from "@/application-services/notes/load-more-notes";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { NotesCounterLoader } from "@/loaders/notes/notes-counter-loader";
import { NotesStackLoader } from "@/loaders/notes/notes-stack-loader";

export default async function Page() {
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
}
