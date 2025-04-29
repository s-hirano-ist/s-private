import { ImageStackSkeleton } from "@/components/stack/image-stack-skeleton";
import { Separator } from "@/components/ui/separator";
import { hasDumperPostPermission } from "@/features/auth/utils/session";
import { AddImageForm } from "@/features/image/components/add-image-form";
import { ImageStack } from "@/features/image/components/image-stack";
import { Suspense } from "react";

export async function SuspensePage() {
	const hasPostPermission = await hasDumperPostPermission();

	return (
		<>
			{hasPostPermission && <AddImageForm />}
			<Separator className="h-px bg-linear-to-r from-primary to-primary-grad" />
			<Suspense fallback={<ImageStackSkeleton />}>
				<ImageStack />
			</Suspense>
		</>
	);
}
