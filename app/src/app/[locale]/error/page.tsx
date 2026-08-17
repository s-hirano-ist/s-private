import type { Route } from "next";
import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { Link } from "@/infrastructures/i18n/routing";
import { buttonVariants } from "@s-hirano-ist/s-ui/button";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

// Auth0 Error page
export default async function Page() {
	// v16: Access connection to enable crypto.randomUUID() for Sentry wrapper
	await connection();
	const t = await getTranslations("statusCode");

	return (
		<main>
			<div className="flex h-screen w-screen flex-col items-center justify-center space-y-4 text-center">
				<StatusCodeView statusCode="500" statusCodeString={t("500")} />
				<Link className={buttonVariants({ variant: "outline" })} href={"/"}>
					Go back to Home
				</Link>
			</div>
		</main>
	);
}
