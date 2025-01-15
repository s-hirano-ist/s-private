import { CardStackSkeleton } from "@/components/stack/card-stack-skeleton";
import { Separator } from "@/components/ui/separator";
import { hasDumperPostPermission } from "@/features/auth/utils/role";
import { AddContentsForm } from "@/features/contents/components/add-contents-form";
import { ContentsStack } from "@/features/contents/components/contents-stack";
import { Suspense } from "react";

export async function SuspensePage() {
	const hasPostPermission = await hasDumperPostPermission();
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
