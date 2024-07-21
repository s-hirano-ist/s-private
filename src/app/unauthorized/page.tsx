import { Header } from "@/components/nav/header";
import { StatusCodeView } from "@/components/status-code-view";
import { Button } from "@/components/ui/button";

export default function Page() {
	return (
		<div className="space-y-2">
			<Header title="Unauthorized" />
			<StatusCodeView statusCode="401" />
			<p className="px-4 text-center text-primary-grad">
				GitHubでログアウトし、許可済みアカウントで再ログインしてください。
			</p>
			<form action="/api/auth/signout" className="flex flex-col">
				<Button className="mx-auto">再サインイン</Button>
			</form>
		</div>
	);
}
