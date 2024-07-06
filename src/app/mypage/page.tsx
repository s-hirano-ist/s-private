import { Header } from "@/components/nav/header";
import { LoadingStack } from "@/components/table/loading-stack";
import { MypageAddForm } from "@/features/blog/components/mypage-add-form";
import { MypageContents } from "@/features/blog/components/mypage-contents";
import type { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Mypage | Dump",
	description: "Dump blog data to GitHub",
};

export default function Page() {
	return (
		<>
			<Header title="Mypageへの送信" />
			<MypageAddForm />
			<Suspense fallback={<LoadingStack />}>
				<MypageContents />
			</Suspense>
		</>
	);
}