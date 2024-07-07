import { Header } from "@/components/nav/header";
import { LoadingStack } from "@/components/stack/loading-stack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogAddProvider } from "@/features/blog/components/blog-add-provider";
import { BlogContents } from "@/features/blog/components/blog-contents";
import { LoadingForm } from "@/features/blog/components/loading-add-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Blog | Dump",
	description: "Dump blog data to GitHub",
};

export default async function Page() {
	return (
		<>
			<Header title="ブログへ送信" url="https://github.com/s-hirano-ist/blog" />
			<Tabs defaultValue="new" className="w-full pt-2">
				<TabsList className="grid grid-cols-2">
					<TabsTrigger value="new">新規</TabsTrigger>
					<TabsTrigger value="queue">送信待ち</TabsTrigger>
				</TabsList>
				<TabsContent value="new">
					<Suspense fallback={<LoadingForm />}>
						<BlogAddProvider />
					</Suspense>
				</TabsContent>
				<TabsContent value="queue">
					<Suspense fallback={<LoadingStack />}>
						<BlogContents />
					</Suspense>
				</TabsContent>
			</Tabs>
		</>
	);
}
