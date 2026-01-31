import { StatusCodeView } from "@s-hirano-ist/s-ui/display/status/status-code-view";
import { Button } from "@s-hirano-ist/s-ui/ui/button";
import type { Route } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/infrastructures/i18n/routing";

// Auth0 Error page
export default async function Page() {
	// v16: Access connection to enable crypto.randomUUID() for Sentry wrapper
	await connection();
	const t = await getTranslations("statusCode");

	return (
		<main>
			<div className="flex h-screen w-screen flex-col items-center justify-center space-y-4 text-center">
				<StatusCodeView statusCode="500" statusCodeString={t("500")} />
				<Button asChild variant="outline">
					<Link href={"/" as Route}>Go back to Home</Link>
				</Button>
			</div>
		</main>
	);
}
