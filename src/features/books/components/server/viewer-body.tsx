import { Route } from "next";
import NextImage from "next/image";
import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { ViewerBodyClient } from "@/common/components/body/viewer-body";
import { NotFound } from "@/common/components/status/not-found";
import { Unexpected } from "@/common/components/status/unexpected";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/common/components/ui/card";
import { getBookByISBN } from "@/features/books/actions/get-books";
import { Link } from "@/i18n/routing";

type Props = { slug: string };

export async function ViewerBody({ slug }: Props) {
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
