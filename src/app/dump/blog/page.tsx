import { Header } from "@/components/nav/header";
import { LoadingStack } from "@/components/stack/loading-stack";
import { Separator } from "@/components/ui/separator";
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
			<Suspense fallback={<LoadingForm />}>
				<BlogAddProvider />
			</Suspense>
			<Separator className="h-px bg-gradient-to-r from-primary to-primary-grad" />
			<Suspense fallback={<LoadingStack />}>
				<BlogContents />
			</Suspense>
		</>
	);
}
