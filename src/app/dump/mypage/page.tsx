import { Header } from "@/components/nav/header";
import { LoadingStack } from "@/components/stack/loading-stack";
import { Separator } from "@/components/ui/separator";
import { MypageAddForm } from "@/features/mypage/components/mypage-add-form";
import { MypageContents } from "@/features/mypage/components/mypage-contents";
import type { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Mypage | Dump",
	description: "Dump mypage data to GitHub",
};

export default function Page() {
	return (
		<>
			<Header
				title="マイページへ送信"
				url="https://github.com/s-hirano-ist/mypage"
			/>
			<MypageAddForm />
			<Separator className="h-px bg-gradient-to-r from-primary to-primary-grad" />
			<Suspense fallback={<LoadingStack />}>
				<MypageContents />
			</Suspense>
		</>
	);
}
