import { Button } from "@/common/components/ui/button";
import { StatusCodeView } from "./status-code-view";

export function Forbidden() {
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
