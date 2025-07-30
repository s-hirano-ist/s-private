import { cache } from "react";
import db from "@/db";
import { staticContents } from "@/db/schema";
import { count } from "drizzle-orm";

const _getAllStaticContents = async () => {
	const contents = await db
		.select({
			title: staticContents.title,
			uint8ArrayImage: staticContents.uint8ArrayImage,
		})
		.from(staticContents);

	return contents.map((content) => ({
		title: content.title,
		href: content.title,
		uint8ArrayImage: content.uint8ArrayImage,
	}));
};

export const getAllStaticContents = cache(_getAllStaticContents);

const _getStaticContentsCount = async () => {
	const [result] = await db
		.select({ count: count() })
		.from(staticContents);
	return result.count;
};

export const getStaticContentsCount = cache(_getStaticContentsCount);
