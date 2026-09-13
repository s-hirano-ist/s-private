import { AuthErrorView } from "@/components/common/display/status/auth-error-view";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";
import { normalizeAuthErrorCode } from "./auth-error-code";

type ErrorPageProps = {
	searchParams: Promise<{
		error?: string | string[];
		error_description?: string | string[];
	}>;
};

async function LocalizedAuthError({ searchParams }: ErrorPageProps) {
	// v16: Access connection to enable crypto.randomUUID() for Sentry wrapper
	await connection();
	const [{ error }, message, label] = await Promise.all([
		searchParams,
		getTranslations("message"),
		getTranslations("label"),
	]);

	return (
		<AuthErrorView
			errorCode={normalizeAuthErrorCode(error)}
			errorCodeLabel={label("authErrorCode")}
			retryLabel={label("resignIn")}
			statusMessage={message("signInUnknown")}
		/>
	);
}

// Auth0 Error page
export default function Page({ searchParams }: ErrorPageProps) {
	return (
		<Suspense>
			<LocalizedAuthError searchParams={searchParams} />
		</Suspense>
	);
}
