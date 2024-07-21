import { Header } from "@/components/nav/header";
import { StatusCodeView } from "@/components/status-code-view";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Unauthorized | Dump",
	description: "Dump blog data to GitHub",
};

export default function Page() {
	return (
		<div className="space-y-2">
			<Header title="Unauthorized" />
			<StatusCodeView statusCode={401} statusMessage="Unauthorized" />
			<p className="text-center text-primary-grad">
				GitHubでログアウトし、許可済みアカウントで再ログインしてください。
			</p>
			<form action="/api/auth/signout" className="flex flex-col">
				<Button className="mx-auto">再サインイン</Button>
			</form>
		</div>
	);
}
