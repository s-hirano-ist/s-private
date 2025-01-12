import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type Props = { showCategory?: boolean; showSubmitButton?: boolean };

export function AddFormSkeleton({
	showCategory = false,
	showSubmitButton = false,
}: Props) {
	return (
		<div className="space-y-4 p-4">
			{showCategory && (
				<div className="space-y-1">
					<Label>カテゴリー</Label>
					<Skeleton className="h-9 " />
				</div>
			)}
			<div className="space-y-1">
				<Label>タイトル</Label>
				<Skeleton className="h-9 " />
			</div>
			<div className="space-y-1">
				<Label>ひとこと</Label>
				<Skeleton className="h-[60px] " />
			</div>
			<div className="space-y-1">
				<Label>URL</Label>
				<Skeleton className="h-9 " />
			</div>
			{showSubmitButton && <Skeleton className="h-9 " />}
		</div>
	);
}
