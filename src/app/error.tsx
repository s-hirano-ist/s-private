"use client"; // Error components must be Client Components
import { captureException } from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/common/ui/button";

export default function Page({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		captureException(error);
	}, [error]);

	return (
		<main>
			<div className="flex h-screen w-screen flex-col items-center justify-center space-y-4 text-center">
				<div
					className="w-full bg-linear-to-r from-primary to-primary-grad bg-clip-text p-2 text-center font-extrabold text-transparent"
					data-testid="status-code-view"
				>
					<div className="text-9xl">
						<span className="hidden font-light sm:inline">---</span>
						500
						<span className="hidden font-light sm:inline">---</span>
					</div>
					<div className="text-sm">------Unexpected Error------</div>
				</div>
				<Button onClick={() => reset()} variant="outline">
					Try again
				</Button>
			</div>
		</main>
	);
}
