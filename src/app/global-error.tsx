"use client"; // Error components must be Client Components
import { StatusCodeView } from "@/components/card/status-code-view";
import { Button } from "@/components/ui/button";
import { captureException } from "@sentry/nextjs";
// biome-ignore lint: auto-gen
import type Error from "next/error";
import { useEffect } from "react";

export default function Page({
	error,
	reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		captureException(error);
	}, [error]);

	return (
		<html lang="ja">
			<body>
				<main>
					<div className="flex h-screen w-screen flex-col items-center justify-center space-y-4 text-center">
						<StatusCodeView statusCode="500" />
						<Button variant="outline" onClick={() => reset()}>
							Try again
						</Button>
					</div>
				</main>
			</body>
		</html>
	);
}
