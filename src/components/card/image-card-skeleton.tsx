import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ImageCardSkeleton() {
	return (
		<Card className="hover:bg-primary/10">
			<CardHeader>
				<div className="flex gap-4">
					<Skeleton className="h-6 w-8" />
				</div>
			</CardHeader>
			<CardContent>
				<Skeleton className="h-[192px] w-[192px]" />
			</CardContent>
		</Card>
	);
}
