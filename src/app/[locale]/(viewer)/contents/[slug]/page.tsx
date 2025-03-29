import Loading from "@/components/loading";
import { PAGE_NAME } from "@/constants";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SuspensePage } from "./_page";

type Parameters_ = Promise<{ slug: string }>;

export async function generateMetadata({
	params,
}: { params: Parameters_ }): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${slug} | ${PAGE_NAME}`,
		description: `Private contents of ${slug}`,
	};
}

export default async function Page({ params }: { params: Parameters_ }) {
	const { slug } = await params;

	return (
		<Suspense fallback={<Loading />}>
			<SuspensePage slug={slug} />
		</Suspense>
	);
}
