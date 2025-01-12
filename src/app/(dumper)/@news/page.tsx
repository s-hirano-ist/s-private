import { StackSkeleton } from "@/components/stack/stack-skeleton";
import { Separator } from "@/components/ui/separator";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasDumperPermission } from "@/features/auth/utils/role";
import { AddFormSkeleton } from "@/features/dump/components/add-form-skeleton";
import { AddNewsProvider } from "@/features/news/components/add-news-provider";
import { NewsStackProvider } from "@/features/news/components/news-stack-provider";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Page() {
	await checkSelfAuthOrRedirectToAuth();

	const hasPostPermission = await hasDumperPermission();

	return (
		<>
			{hasPostPermission && (
				<Suspense fallback={<AddFormSkeleton showCategory showSubmitButton />}>
					<AddNewsProvider />
				</Suspense>
			)}
			<Separator className="h-px bg-gradient-to-r from-primary to-primary-grad" />
			<Suspense fallback={<StackSkeleton />}>
				<NewsStackProvider />
			</Suspense>
		</>
	);
}
