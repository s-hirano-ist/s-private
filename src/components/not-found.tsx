import { StatusCodeView } from "@/components/status-code-view";
import { Button } from "@/components/ui/button";
import { Link } from "next-view-transitions";

export function NotFound() {
	return (
		<div className="space-y-2">
			<StatusCodeView statusCode="404" />
			<p className="px-4 text-center text-primary-grad">
				お探しのコンテンツが見つかりませんでした。
			</p>
			<Button className="mx-auto flex w-1/2 flex-col" asChild>
				<Link href="/auth">HOMEへ戻る</Link>
			</Button>
		</div>
	);
}
