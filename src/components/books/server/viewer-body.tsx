import { Route } from "next";
import NextImage from "next/image";
import { forbidden } from "next/navigation";
import type { getBookByISBN } from "@/application-services/books/get-books";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { NotFound } from "@/components/common/display/status/not-found";
import { Unexpected } from "@/components/common/display/status/unexpected";
import { ViewerBodyClient } from "@/components/common/layouts/body/viewer-body";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/common/ui/card";
import { Link } from "@/infrastructures/i18n/routing";

type Props = { slug: string; getBookByISBN: typeof getBookByISBN };

export async function ViewerBody({ slug, getBookByISBN }: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const data = await getBookByISBN(slug);
		if (!data) return <NotFound />;

		return (
			<ViewerBodyClient markdown={data?.markdown ?? ""}>
				<Card className="grid grid-cols-4 gap-4 p-4">
					<div className="flex items-center justify-center">
						<NextImage
							alt={data.googleTitle ?? ""}
							className="rounded bg-white p-1"
							height={192}
							src={data.googleImgSrc ?? "/not-found.png"}
							width={192}
						/>
					</div>
					<Link className="col-span-3" href={data.googleHref ?? ("/" as Route)}>
						<CardHeader>
							<CardTitle>
								{data.googleTitle} {data.googleSubTitle}
							</CardTitle>
							<CardDescription>{data.googleDescription}</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Authors: {data.googleAuthors?.join(", ")}</p>
						</CardContent>
					</Link>
				</Card>
			</ViewerBodyClient>
		);
	} catch (error) {
		return <Unexpected caller="viewer-body" error={error} />;
	}
}
