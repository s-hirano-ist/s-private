import Loading from "@/components/loading";
import { PAGE_NAME } from "@/constants";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SuspensePage } from "./_page";

export const dynamic = "force-dynamic";
export const runtime = "edge";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
	params,
}: { params: Params }): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${decodeURIComponent(slug)} | ${PAGE_NAME}`,
		description: `Private book review of ${decodeURIComponent(slug)}`,
	};
}

export default async function Page({ params }: { params: Params }) {
	const { slug } = await params;

	return (
		<Suspense fallback={<Loading />}>
			<SuspensePage slug={slug} />
		</Suspense>
	);
}
