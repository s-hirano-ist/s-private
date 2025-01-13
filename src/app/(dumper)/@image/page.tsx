import { ImageStackSkeleton } from "@/components/stack/image-stack-skeleton";
import { Separator } from "@/components/ui/separator";
import { hasDumperPostPermission } from "@/features/auth/utils/role";
import { AddImageForm } from "@/features/image/components/add-image-form";
import { ImageStack } from "@/features/image/components/image-stack";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Page() {
	const hasPostPermission = await hasDumperPostPermission();

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
