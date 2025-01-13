import { StatusCodeView } from "@/components/card/status-code-view";
import { Button } from "@/components/ui/button";

export function Unauthorized() {
	return (
		<div className="space-y-2">
			<StatusCodeView statusCode="403" />
			<p className="px-4 text-center text-primary-grad">
				権限がありません。別のアカウントで再サインインしてください。
			</p>
			<form action="/api/auth/signout" className="flex flex-col" method="post">
				<Button className="mx-auto" type="submit">
					再サインイン
				</Button>
			</form>
		</div>
	);
}
