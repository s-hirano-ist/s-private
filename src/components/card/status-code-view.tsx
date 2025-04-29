"use client";
import { useTranslations } from "next-intl";

type StatusCode = "000" | "204" | "403" | "404" | "500";

export function StatusCodeView({ statusCode }: { statusCode: StatusCode }) {
	const t = useTranslations("statusCode");

	return (
		<div
			className="w-full bg-linear-to-r from-primary-grad-from to-primary-grad-to bg-clip-text p-2 text-center font-extrabold text-transparent"
			data-testid="status-code-view"
		>
			<div className="text-9xl">
				<span className="hidden font-light sm:inline">---</span>
				{String(statusCode)}
				<span className="hidden font-light sm:inline">---</span>
			</div>
			<div className="text-sm">------{t(statusCode)}------</div>
		</div>
	);
}
