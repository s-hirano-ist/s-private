import { Header } from "@/components/nav/header";
import { LoadingStack } from "@/components/stack/loading-stack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingForm } from "@/features/blog/components/loading-add-form";
import { MypageAddForm } from "@/features/mypage/components/mypage-add-form";
import { MypageContents } from "@/features/mypage/components/mypage-contents";
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
			<Header
				title="マイページへ送信"
				url="https://github.com/s-hirano-ist/mypage"
			/>
			<Tabs defaultValue="new" className="w-full pt-2">
				<TabsList className="grid grid-cols-2">
					<TabsTrigger value="new">新規</TabsTrigger>
					<TabsTrigger value="queue">送信待ち</TabsTrigger>
				</TabsList>
				<TabsContent value="new">
					<Suspense fallback={<LoadingForm />}>
						<MypageAddForm />
					</Suspense>
				</TabsContent>
				<TabsContent value="queue">
					<Suspense fallback={<LoadingStack />}>
						<MypageContents />
					</Suspense>
				</TabsContent>
			</Tabs>
		</>
	);
}
