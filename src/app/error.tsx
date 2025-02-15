"use client"; // Error components must be Client Components
import { Button } from "@/components/ui/button";
import { loggerError } from "@/pino";
import { captureException } from "@sentry/nextjs";
import { useEffect } from "react";

export default function Page({
	error,
	reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		loggerError(
			"Unexpected error occurred.",
			{
				caller: "ErrorPage",
				status: 500,
			},
			error,
		);
		captureException(error);
	}, [error]);

	return (
		<main>
			<div className="flex h-screen w-screen flex-col items-center justify-center space-y-4 text-center">
				<div
					className="w-full bg-gradient-to-r from-primary-grad-from to-primary-grad-to bg-clip-text p-2 text-center font-extrabold text-transparent"
					data-testid="status-code-view"
				>
					<div className="text-9xl">
						<span className="hidden font-light sm:inline">---</span>
						500
						<span className="hidden font-light sm:inline">---</span>
					</div>
					<div className="text-sm">------Unexpected Error------</div>
				</div>
				<Button variant="outline" onClick={() => reset()}>
					Try again
				</Button>
			</div>
		</main>
	);
}
