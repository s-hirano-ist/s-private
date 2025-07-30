import { cache } from "react";
import prisma from "@/prisma";

const _getAllStaticContents = async () => {
	const contents = await prisma.staticContents.findMany({
		select: { title: true, uint8ArrayImage: true },
		cacheStrategy: { ttl: 400, tags: ["staticContents"] },
	});

	return contents.map((content) => ({
		title: content.title,
		href: content.title,
		image: content.uint8ArrayImage,
	}));
};

export const getAllStaticContents = cache(_getAllStaticContents);

const _getStaticContentsCount = async () => {
	return await prisma.staticContents.count({});
};

export const getStaticContentsCount = cache(_getStaticContentsCount);
