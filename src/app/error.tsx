"use client"; // Error components must be Client Components
import { StatusCodeView } from "@/components/card/status-code-view";
import { Button } from "@/components/ui/button";
import { loggerError } from "@/pino";
import { captureException } from "@sentry/nextjs";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function Page({
	error,
	reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
	const t = useTranslations("message");

	useEffect(() => {
		loggerError(
			t("unexpected"),
			{
				caller: "ErrorPage",
				status: 500,
			},
			error,
		);
		captureException(error);
	}, [error, t]);

	return (
		<main>
			<div className="flex h-screen w-screen flex-col items-center justify-center space-y-4 text-center">
				<StatusCodeView statusCode="500" />
				<Button variant="outline" onClick={() => reset()}>
					Try again
				</Button>
			</div>
		</main>
	);
}
