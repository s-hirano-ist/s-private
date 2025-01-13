import { CardStackSkeleton } from "@/components/stack/card-stack-skeleton";
import { Separator } from "@/components/ui/separator";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasDumperPermission } from "@/features/auth/utils/role";
import { AddContentsProvider } from "@/features/contents/components/add-contents-provider";
import { ContentsStackProvider } from "@/features/contents/components/contents-stack-provider";
import { AddFormSkeleton } from "@/features/dump/components/add-form-skeleton";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Page() {
	await checkSelfAuthOrRedirectToAuth();

	const hasPostPermission = await hasDumperPermission();
	return (
		<>
			{hasPostPermission && (
				<Suspense fallback={<AddFormSkeleton showSubmitButton />}>
					<AddContentsProvider />
				</Suspense>
			)}
			<Separator className="h-px bg-gradient-to-r from-primary to-primary-grad" />
			<Suspense fallback={<CardStackSkeleton />}>
				<ContentsStackProvider />
			</Suspense>
		</>
	);
}
