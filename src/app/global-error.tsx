"use client"; // Error components must be Client Components
import { captureException } from "@sentry/nextjs";
// biome-ignore lint: auto-gen
import type Error from "next/error";
import { useEffect } from "react";
import { Button } from "@/common/components/ui/button";

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
		<html lang="ja">
			<body>
				<main>
					<div className="flex h-screen w-screen flex-col items-center justify-center space-y-4 text-center">
						<div
							className="w-full bg-linear-to-r from-primary-grad-from to-primary-grad-to bg-clip-text p-2 text-center font-extrabold text-transparent"
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
			</body>
		</html>
	);
}
