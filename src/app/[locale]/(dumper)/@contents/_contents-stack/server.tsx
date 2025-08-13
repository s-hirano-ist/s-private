import { StatusCodeView } from "@/components/status/status-code-view";
import { contentsQueryRepository } from "@/features/contents/repositories/contents-query-repository";
import { loggerError } from "@/pino";
import { getSelfId } from "@/utils/auth/session";
import { ContentsStackClient } from "./client";

export async function ContentsStack() {
	try {
		const userId = await getSelfId();

		const unexportedContents =
			await contentsQueryRepository.findByStatusAndUserId("UNEXPORTED", userId);

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
