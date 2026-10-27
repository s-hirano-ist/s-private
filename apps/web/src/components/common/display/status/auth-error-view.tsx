import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { buttonVariants } from "@s-hirano-ist/s-ui/button";

export type AuthErrorViewProps = {
	errorCode: string;
	errorCodeLabel: string;
	retryLabel: string;
	statusMessage: string;
};

export function AuthErrorView({
	errorCode,
	errorCodeLabel,
	retryLabel,
	statusMessage,
}: AuthErrorViewProps) {
	return (
		<main>
			<div className="flex h-screen w-screen flex-col items-center justify-center space-y-4 text-center">
				<StatusCodeView statusCode="500" statusCodeString={statusMessage} />
				<p className="text-muted-foreground text-sm">
					{errorCodeLabel}: <code className="font-mono">{errorCode}</code>
				</p>
				{/* OAuth starts a document navigation; RSC prefetch follows the external redirect and violates connect-src. */}
				{/* oxlint-disable-next-line next/no-html-link-for-pages -- API endpoint, not a Next.js page. */}
				<a
					className={buttonVariants({ variant: "outline" })}
					href="/api/sign-in"
				>
					{retryLabel}
				</a>
			</div>
		</main>
	);
}
