import { Button } from "@/components/ui/button";
import type { Route } from "next";
import { Link } from "next-view-transitions";

export function NotFound() {
	return (
		<div className="space-y-2">
			<div
				className="w-full bg-gradient-to-r from-primary-grad-from to-primary-grad-to bg-clip-text p-2 text-center font-extrabold text-transparent"
				data-testid="status-code-view"
			>
				<div className="text-9xl">
					<span className="hidden font-light sm:inline">---</span>
					404
					<span className="hidden font-light sm:inline">---</span>
				</div>
				<div className="text-sm">------Not Found------</div>
			</div>
			<p className="px-4 text-center text-primary-grad">
				お探しのコンテンツが見つかりませんでした。
			</p>
			<Button className="mx-auto flex w-1/2 flex-col" asChild>
				<Link href={"/" as Route}>HOMEへ戻る</Link>
			</Button>
		</div>
	);
}
