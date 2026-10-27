import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { buttonVariants } from "@s-hirano-ist/s-ui/button";
import Link from "next/link";

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
				<Link
					className={buttonVariants({ variant: "outline" })}
					href="/api/sign-in"
				>
					{retryLabel}
				</Link>
			</div>
		</main>
	);
}
