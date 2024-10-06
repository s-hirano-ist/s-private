import { Header } from "@/components/nav/header";
import { LoadingTable } from "@/components/table/loading-table";
import { Separator } from "@/components/ui/separator";
import { PAGE_NAME } from "@/constants";
import { ContentsTable } from "@/features/submit/components/contents-table";
import { NewsTable } from "@/features/submit/components/news-table";
import type { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: `全データ | ${PAGE_NAME}`,
	description: "All data of news/contents dump",
};

// TODO: role === admin 以外はアクセス不能にする

export default function Home() {
	return (
		<div className="space-y-2">
			<Header title="全データ" />
			<h2 className="px-4">s-public</h2>
			<Suspense fallback={<LoadingTable />}>
				<NewsTable />
			</Suspense>
			<Separator className="h-px bg-gradient-to-r from-primary to-primary-grad" />
			<h2 className="px-4">s-private</h2>
			<Suspense fallback={<LoadingTable />}>
				<ContentsTable />
			</Suspense>
		</div>
	);
}
