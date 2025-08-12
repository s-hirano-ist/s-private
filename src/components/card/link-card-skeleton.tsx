import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LinkCardSkeleton() {
	return (
		<Card className="hover:bg-primary/10">
			<CardHeader>
				<div className="flex gap-4">
					<Skeleton className="h-6 w-8" />
					<Skeleton className="h-6 w-24" />
				</div>
			</CardHeader>
			<CardContent>
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-full" />
			</CardContent>
		</Card>
	);
}
