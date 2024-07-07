import { Header } from "@/components/nav/header";
import { LoadingTable } from "@/components/table/loading-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogTable } from "@/features/blog/components/blog-table";
import { MypageTable } from "@/features/mypage/components/mypage-table";
import type { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "All | Dump",
	description: "Dump blog data to GitHub",
};

export default function Home() {
	return (
		<>
			<Header title="全データ" />
			<Tabs defaultValue="blog" className="w-full pt-2">
				<TabsList className="grid grid-cols-2">
					<TabsTrigger value="blog">ブログ</TabsTrigger>
					<TabsTrigger value="mypage">マイページ</TabsTrigger>
				</TabsList>
				<TabsContent value="blog">
					<Suspense fallback={<LoadingTable />}>
						<BlogTable />
					</Suspense>
				</TabsContent>
				<TabsContent value="mypage">
					<Suspense fallback={<LoadingTable />}>
						<MypageTable />
					</Suspense>
				</TabsContent>
			</Tabs>
		</>
	);
}
