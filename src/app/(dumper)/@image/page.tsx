import { ImageStackSkeleton } from "@/components/stack/image-stack-skeleton";
import { Separator } from "@/components/ui/separator";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasDumperPermission } from "@/features/auth/utils/role";
import { AddImageForm } from "@/features/image/components/add-image-form";
import { ImageStack } from "@/features/image/components/image-stack";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Page() {
	await checkSelfAuthOrRedirectToAuth();

	const hasPostPermission = await hasDumperPermission();

	return (
		<>
			{hasPostPermission && <AddImageForm />}
			<Separator className="h-px bg-gradient-to-r from-primary to-primary-grad" />
			<Suspense fallback={<ImageStackSkeleton />}>
				<ImageStack />
			</Suspense>
		</>
	);
}
