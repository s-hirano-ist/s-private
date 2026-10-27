"use client";

import { Button } from "@s-hirano-ist/s-ui/button";
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
			variant="ghost"
		>
			<ArrowLeft className="size-3.5" />
		</Button>
	);
}
