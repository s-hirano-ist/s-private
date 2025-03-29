import Loading from "@/components/loading";
import { PAGE_NAME } from "@/constants";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SuspensePage } from "./_page";

type Props = Promise<{ slug: string }>;

export async function generateMetadata({
	params,
}: { params: Props }): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${decodeURIComponent(slug)} | ${PAGE_NAME}`,
		description: `Private book review of ${decodeURIComponent(slug)}`,
	};
}

export default async function Page({ params }: { params: Props }) {
	const { slug } = await params;

	return (
		<Suspense fallback={<Loading />}>
			<SuspensePage slug={slug} />
		</Suspense>
	);
}
