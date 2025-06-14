import prisma from "@/prisma";
import { cache } from "react";

const _getAllStaticContents = async () => {
	const contents = await prisma.staticContents.findMany({
		select: { title: true, uint8ArrayImage: true },
		cacheStrategy: { ttl: 400, tags: ["staticContents"] },
	});

	return contents.map((content) => ({
		title: content.title,
		href: content.title,
		uint8ArrayImage: content.uint8ArrayImage,
	}));
};

export const getAllStaticContents = cache(_getAllStaticContents);

const _getStaticContentsCount = async () => {
	return await prisma.staticContents.count({});
};

export const getStaticContentsCount = cache(_getStaticContentsCount);
