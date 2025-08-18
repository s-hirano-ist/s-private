import type { Route } from "next";
import NextImage from "next/image";
import { notFound } from "next/navigation";
import type { getBookByISBN } from "@/application-services/books/get-books";
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
	const data = await getBookByISBN(slug);
	if (!data) notFound();

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
}
