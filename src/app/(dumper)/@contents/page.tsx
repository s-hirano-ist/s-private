import { CardStackSkeleton } from "@/components/stack/card-stack-skeleton";
import { Separator } from "@/components/ui/separator";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasDumperPermission } from "@/features/auth/utils/role";
import { AddContentsForm } from "@/features/contents/components/add-contents-form";
import { ContentsStack } from "@/features/contents/components/contents-stack";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Page() {
	await checkSelfAuthOrRedirectToAuth();

	const hasPostPermission = await hasDumperPermission();
	return (
		<>
			{hasPostPermission && <AddContentsForm />}
			<Separator className="h-px bg-gradient-to-r from-primary to-primary-grad" />
			<Suspense fallback={<CardStackSkeleton />}>
				<ContentsStack />
			</Suspense>
		</>
	);
}
