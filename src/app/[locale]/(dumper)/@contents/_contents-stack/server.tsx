import { StatusCodeView } from "@/components/status/status-code-view";
import { getUnexportedContentsByUserId } from "@/features/contents/actions/get-contents";
import { loggerError } from "@/pino";
import { ContentsStackClient } from "./client";

export async function ContentsStack() {
	try {
		const unexportedContents = await getUnexportedContentsByUserId();

		return <ContentsStackClient data={unexportedContents} />;
	} catch (error) {
		loggerError("unexpected", { caller: "ContentsStack", status: 500 }, error);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
