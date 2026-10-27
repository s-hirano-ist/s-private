import type { ReactNode } from "react";
import { reportRenderError } from "@/common/observability/report-render-error";
import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { getTranslations } from "next-intl/server";
import { unstable_rethrow } from "next/navigation";

type Props = {
	errorCaller: string;
	fallback?: ReactNode;
	render: () => Promise<ReactNode>;
};

export async function ErrorBoundary({ render, errorCaller, fallback }: Props) {
	const t = await getTranslations("statusCode");

	try {
		return await render();
	} catch (error) {
		unstable_rethrow(error);

		reportRenderError(error, errorCaller);

		if (fallback) return fallback;

		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" statusCodeString={t("500")} />
			</div>
		);
	}
}
