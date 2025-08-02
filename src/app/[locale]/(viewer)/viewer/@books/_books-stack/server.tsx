import { StatusCodeView } from "@/components/card/status-code-view";
import { Unauthorized } from "@/components/card/unauthorized";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import {
	getAllStaticBooks,
	getStaticBooksCount,
} from "@/features/viewer/actions/static-books";
import { loggerError } from "@/pino";
import { BooksStackClient } from "./client";

export async function BooksStack() {
	try {
		const hasAdminPermission = await hasViewerAdminPermission();
		if (!hasAdminPermission) return <Unauthorized />;

		const totalBooks = await getStaticBooksCount();
		const previewCardData = await getAllStaticBooks();

		return (
			<BooksStackClient
				previewCardData={previewCardData}
				totalBooks={totalBooks}
			/>
		);
	} catch (error) {
		loggerError("unexpected", { caller: "BooksStack", status: 500 }, error);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
