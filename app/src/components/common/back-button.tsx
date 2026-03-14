"use client";

import { Button } from "@s-hirano-ist/s-ui/ui/button";
import { haptic } from "@s-hirano-ist/s-ui/utils/haptic";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
	const router = useRouter();

	return (
		<Button
			aria-label="Back"
			onClick={() => {
				haptic();
				router.back();
			}}
			size="sm"
			variant="ghost"
		>
			<ArrowLeft className="size-4" />
		</Button>
	);
}
