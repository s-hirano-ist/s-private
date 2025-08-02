import { forbidden } from "next/navigation";
import { PAGE_SIZE } from "@/constants";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import prisma from "@/prisma";
import { AllImageStackClient } from "./client";

type Props = { page: number };

export async function AllImageStack({ page }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	const images = await prisma.staticImages.findMany({
		select: { id: true, width: true, height: true },
		orderBy: { id: "desc" },
		skip: (page - 1) * PAGE_SIZE,
		take: PAGE_SIZE,
		cacheStrategy: { ttl: 400, swr: 40, tags: ["staticImages"] },
	});

	return <AllImageStackClient images={images} />;
}
