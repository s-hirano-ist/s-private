import { PAGE_NAME } from "@/constants";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { auth } from "@/features/auth/utils/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

const displayName = "サインイン";

export const metadata: Metadata = {
	title: `${displayName} | ${PAGE_NAME} `,
	description: `Sign in page of ${PAGE_NAME}`,
	robots: { googleBot: { index: false }, index: false },
};

export default async function Page() {
	const session = await auth();
	if (session) redirect("/");

	return (
		<div className="mx-auto max-w-screen-sm px-2 pt-4">
			<SignInForm />
		</div>
	);
}
