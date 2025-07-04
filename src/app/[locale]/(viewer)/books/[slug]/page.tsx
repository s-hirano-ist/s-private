import type { Metadata } from "next";
import { Suspense } from "react";
import Loading from "@/components/loading";
import { PAGE_NAME } from "@/constants";
import { SuspensePage } from "./_page";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
	params,
}: {
	params: Params;
}): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${slug} | ${PAGE_NAME}`,
		description: `Private book review of ${slug}`,
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
