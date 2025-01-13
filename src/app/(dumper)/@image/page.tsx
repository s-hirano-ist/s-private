import { ImageStackSkeleton } from "@/components/stack/image-stack-skeleton";
import { Separator } from "@/components/ui/separator";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasDumperPermission } from "@/features/auth/utils/role";
import { AddFormSkeleton } from "@/features/dump/components/add-form-skeleton";
import { AddImageProvider } from "@/features/image/components/add-image-provider";
import { ImageStack } from "@/features/image/components/image-stack";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Page() {
	await checkSelfAuthOrRedirectToAuth();

	const hasPostPermission = await hasDumperPermission();

	return (
		<>
			{hasPostPermission && (
				<Suspense fallback={<AddFormSkeleton showSubmitButton />}>
					<AddImageProvider />
				</Suspense>
			)}
			<Separator className="h-px bg-gradient-to-r from-primary to-primary-grad" />
			<Suspense fallback={<ImageStackSkeleton />}>
				<ImageStack />
			</Suspense>
		</>
	);
}
