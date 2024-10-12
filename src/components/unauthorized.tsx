import { StatusCodeView } from "@/components/status-code-view";
import { Button } from "@/components/ui/button";

export function Unauthorized() {
	return (
		<div className="space-y-2">
			<StatusCodeView statusCode="403" />
			<p className="px-4 text-center text-primary-grad">
				権限がありません。別のアカウントで再サインインしてください。
			</p>
			<form action="/api/auth/signout" className="flex flex-col">
				<Button className="mx-auto">再サインイン</Button>
			</form>
		</div>
	);
}
