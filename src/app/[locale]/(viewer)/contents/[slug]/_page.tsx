import { ViewerBody } from "@/components/body/viewer-body";
import { NotFound } from "@/components/card/not-found";
import { Unauthorized } from "@/components/card/unauthorized";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import db from "@/db";
import { staticContents } from "@/db/schema";
import { eq } from "drizzle-orm";

type Props = { slug: string };

export async function SuspensePage({ slug }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();

	const [data] = await db
		.select({ markdown: staticContents.markdown })
		.from(staticContents)
		.where(eq(staticContents.title, slug))
		.limit(1);
	if (!data) return <NotFound />;

	return (
		<>
			{hasAdminPermission ? (
				<ViewerBody markdown={data.markdown} />
			) : (
				<Unauthorized />
			)}
		</>
	);
}
